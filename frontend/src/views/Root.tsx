'use client';
import { Background, BackgroundVariant, MiniMap, Node, Position, ReactFlow } from '@xyflow/react';
import PersonNode, { TPersionNode } from 'src/components/PersonNode/PersonNode';
import RelationshipNode, { TRelationshipNode } from 'src/components/RelationshipNode/RelationshipNode';
import { Gender } from 'src/constants';
import { useState, useEffect, useCallback } from 'react';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import personService, { Person } from 'src/services/personService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import parentChildService, { ParentChildWithDetails } from 'src/services/parentChildService';

export default function Root() {
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);
    const [persons, setPersons] = useState<Person[]>([]);
    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [parentChilds, setParentChilds] = useState<ParentChildWithDetails[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<any[]>([]);

    const handlePersonNodeClick = useCallback(
        (personData: any) => {
            const fullPerson = persons.find((p) => p._id === personData.id);
            if (fullPerson) {
                setSelectedPerson(fullPerson);
                setPersonDetailModalOpen(true);
            }
        },
        [persons],
    );

    const nodeTypes = {
        relationship: RelationshipNode,
        person: (props: any) => <PersonNode {...props} onClick={handlePersonNodeClick} />,
    };

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (persons.length > 0) {
            buildFamilyTree();
        }
    }, [persons, spouses, parentChilds]);

    const buildFamilyTree = () => {
        const newNodes: Node[] = [];
        const newEdges: any[] = [];
        const createdEdges = new Set<string>(); // Track created edges to avoid duplicates
        const createdNodes = new Set<string>(); // Track created nodes to avoid duplicates

        // ROOT PERSON ID - ID của tổ tiên đầu tiên (ví dụ: Lê Đình A)
        // TODO: Lấy từ props hoặc config, hiện tại hard-code để test
        const ROOT_PERSON_ID = persons.find((p) => p.name?.includes('Lê Đình A'))?._id || persons[0]?._id;

        const PERSON_WIDTH = 128;
        const RELATIONSHIP_WIDTH = 128; // Đã đổi thành 128 để khớp với person width
        const HORIZONTAL_GAP = 80;
        const GEN_VERTICAL_SPACE = 550; // Tăng height của generation box
        const GEN_GAP = 20; // Gap giữa các generation boxes

        // Vertical offsets RELATIVE trong generation - TĂNG KHOẢNG CÁCH để edges thẳng
        const OFFSET_PERSON = 40; // Person position (hàng 1)
        const OFFSET_RELATIONSHIP = 230; // Relationship diamond (hàng 2) - tăng từ 200 lên 250
        const OFFSET_SPOUSE = 410; // Spouse position (hàng 3) - tăng từ 350 lên 450

        const mapGender = (genderValue: any): Gender => {
            if (genderValue === 0 || genderValue === '0') return Gender.MALE;
            if (genderValue === 1 || genderValue === '1') return Gender.FEMALE;
            return Gender.MALE;
        };

        const personMap = new Map<string, Person>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();
        const childrenMap = new Map<string, ParentChildWithDetails[]>();

        persons.forEach((p) => personMap.set(p._id!, p));

        spouses.forEach((spouse) => {
            const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
            const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;

            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                spouseMap.get(husbandId)!.push(spouse);
            }
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                spouseMap.get(wifeId)!.push(spouse);
            }
        });

        parentChilds.forEach((pc) => {
            const parentId = typeof pc.parent === 'string' ? pc.parent : pc.parent._id;
            if (parentId) {
                if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
                childrenMap.get(parentId)!.push(pc);
            }
        });

        // Find roots - BẮT ĐẦU TỪ ROOT_PERSON_ID CỐ ĐỊNH
        const allChildIds = new Set(parentChilds.map((pc) => (typeof pc.child === 'string' ? pc.child : pc.child._id)));

        // Chỉ lấy ROOT_PERSON_ID làm điểm bắt đầu
        const rootPerson = personMap.get(ROOT_PERSON_ID!);
        const rootPersons = rootPerson ? [rootPerson] : []; // Build generations - CHỈ CON TRỰC HỆ được đưa vào thế hệ mới
        const generations: Person[][] = [];
        const visited = new Set<string>();
        const personGeneration = new Map<string, number>(); // Track generation for each person

        const buildGen = (personIds: string[], genIndex: number) => {
            if (personIds.length === 0) return;
            const genPersons: Person[] = [];
            const nextGenIds = new Set<string>();

            personIds.forEach((pid) => {
                if (visited.has(pid)) return;
                visited.add(pid);
                personGeneration.set(pid, genIndex);
                const person = personMap.get(pid);
                if (!person) return;
                genPersons.push(person);

                // Chỉ con cái được thêm vào thế hệ tiếp theo, VỢ/CHỒNG KHÔNG
                const personSpouses = spouseMap.get(pid) || [];
                personSpouses.forEach((spouse) => {
                    const children = childrenMap.get(spouse._id!) || [];
                    children.forEach((pc) => {
                        const childId = typeof pc.child === 'string' ? pc.child : pc.child._id;
                        if (childId && !visited.has(childId)) nextGenIds.add(childId);
                    });
                });
            });

            generations[genIndex] = genPersons;
            if (nextGenIds.size > 0) {
                // Sort nextGen theo birth date trước khi build
                const sortedNextGenIds = Array.from(nextGenIds).sort((a, b) => {
                    const personA = personMap.get(a);
                    const personB = personMap.get(b);
                    if (!personA?.birth || !personB?.birth) return 0;
                    return new Date(personA.birth).getTime() - new Date(personB.birth).getTime();
                });
                buildGen(sortedNextGenIds, genIndex + 1);
            }
        };

        buildGen(
            rootPersons.map((p) => p._id!),
            0,
        );

        // Layout - BOTTOM-UP ALGORITHM để cân bằng cây
        // Bước 1: Tính X position cho tất cả nodes, bắt đầu từ thế hệ cuối
        const nodeXPositions = new Map<string, number>(); // Lưu X position của mỗi person node
        const spouseNodeXPositions = new Map<string, number>(); // Lưu X của spouse nodes (row 3)
        const relationshipXPositions = new Map<string, number>(); // Lưu X của relationship nodes (row 2)

        let currentY = 100;

        // BƯỚC 1A: Duyệt thế hệ cuối trước để set initial X positions
        // Group children theo parent để tránh đè lên nhau
        const lastGenIndex = generations.length - 1;

        if (lastGenIndex >= 0) {
            const lastGen = generations[lastGenIndex];

            // Group children by their parents (từ thế hệ trước)
            const childrenByParent = new Map<string, string[]>(); // parentSpouseId -> childIds[]

            if (lastGenIndex > 0) {
                const prevGen = generations[lastGenIndex - 1];

                prevGen.forEach((parent) => {
                    const parentSpouses = spouseMap.get(parent._id!) || [];

                    // SORT SPOUSES THEO THỨ TỰ (husbandOrder/wifeOrder hoặc marriageDate)
                    const sortedSpouses = [...parentSpouses].sort((a, b) => {
                        const orderA = a.husbandOrder || a.wifeOrder || 0;
                        const orderB = b.husbandOrder || b.wifeOrder || 0;
                        if (orderA !== orderB) return orderA - orderB;

                        // Fallback: sort by marriageDate
                        if (a.marriageDate && b.marriageDate) {
                            return new Date(a.marriageDate).getTime() - new Date(b.marriageDate).getTime();
                        }
                        return 0;
                    });

                    sortedSpouses.forEach((spouse, spouseIdx) => {
                        const children = childrenMap.get(spouse._id!) || []; // SORT CHILDREN THEO NGÀY SINH (birth date) - TỪ CŨ ĐẾN MỚI (trái -> phải)
                        const sortedChildren = children.sort((a, b) => {
                            const childA = typeof a.child === 'string' ? personMap.get(a.child) : a.child;
                            const childB = typeof b.child === 'string' ? personMap.get(b.child) : b.child;

                            if (!childA?.birth || !childB?.birth) return 0;

                            const dateA = new Date(childA.birth).getTime();
                            const dateB = new Date(childB.birth).getTime();

                            return dateA - dateB; // Sinh trước (số nhỏ hơn) -> trước trong array -> bên trái
                        });

                        const childIds = sortedChildren.map((pc) => (typeof pc.child === 'string' ? pc.child : pc.child._id)).filter((id) => id) as string[];

                        if (childIds.length > 0) {
                            childrenByParent.set(spouse._id!, childIds);
                        }
                    });
                });
            }

            let currentX = 100;
            const processedChildren = new Set<string>();

            // Layout children theo groups - ITERATE THEO THỨ TỰ CỦA PREVGEN
            if (lastGenIndex > 0) {
                const prevGen = generations[lastGenIndex - 1];

                prevGen.forEach((parent) => {
                    const parentSpouses = spouseMap.get(parent._id!) || [];

                    // SORT SPOUSES THEO THỨ TỰ (same logic as above)
                    const sortedSpouses = [...parentSpouses].sort((a, b) => {
                        const orderA = a.husbandOrder || a.wifeOrder || 0;
                        const orderB = b.husbandOrder || b.wifeOrder || 0;
                        if (orderA !== orderB) return orderA - orderB;

                        if (a.marriageDate && b.marriageDate) {
                            return new Date(a.marriageDate).getTime() - new Date(b.marriageDate).getTime();
                        }
                        return 0;
                    });

                    sortedSpouses.forEach((spouse) => {
                        const childIds = childrenByParent.get(spouse._id!);
                        if (!childIds || childIds.length === 0) return;

                        childIds.forEach((childId) => {
                            if (processedChildren.has(childId)) return;
                            processedChildren.add(childId);

                            const person = personMap.get(childId);
                            if (!person) return;

                            const personSpouses = spouseMap.get(childId) || [];
                            const numSpouses = personSpouses.length;

                            if (numSpouses > 0) {
                                const totalWidth = numSpouses * PERSON_WIDTH + (numSpouses - 1) * HORIZONTAL_GAP;
                                const personX = currentX + totalWidth / 2 - PERSON_WIDTH / 2;
                                nodeXPositions.set(childId, personX);

                                personSpouses.forEach((spouse, idx) => {
                                    const spouseX = currentX + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                                    const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
                                    const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;
                                    const spousePersonId = husbandId === childId ? wifeId : husbandId;
                                    const spouseGen = personGeneration.get(spousePersonId!);

                                    if (spouseGen === undefined) {
                                        const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${childId}_${idx}`;
                                        spouseNodeXPositions.set(uniqueSpouseNodeId, spouseX);
                                    }

                                    relationshipXPositions.set(spouse._id!, spouseX);
                                });

                                currentX += totalWidth + HORIZONTAL_GAP;
                            } else {
                                nodeXPositions.set(childId, currentX);

                                currentX += PERSON_WIDTH + HORIZONTAL_GAP;
                            }
                        });

                        // Gap giữa các family groups
                        currentX += HORIZONTAL_GAP;
                    });
                });
            }

            // Process remaining children (không có parent info)
            lastGen.forEach((person) => {
                const personId = person._id!;
                if (processedChildren.has(personId)) return;
                processedChildren.add(personId);

                const personSpouses = spouseMap.get(personId) || [];
                const numSpouses = personSpouses.length;

                if (numSpouses > 0) {
                    const totalWidth = numSpouses * PERSON_WIDTH + (numSpouses - 1) * HORIZONTAL_GAP;
                    const personX = currentX + totalWidth / 2 - PERSON_WIDTH / 2;
                    nodeXPositions.set(personId, personX);

                    personSpouses.forEach((spouse, idx) => {
                        const spouseX = currentX + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                        relationshipXPositions.set(spouse._id!, spouseX);
                    });

                    currentX += totalWidth + HORIZONTAL_GAP;
                } else {
                    nodeXPositions.set(personId, currentX);
                    currentX += PERSON_WIDTH + HORIZONTAL_GAP;
                }
            });
        }

        // BƯỚC 1B: Duyệt ngược từ thế hệ gần cuối về đầu để tính position based on children
        for (let genIndex = generations.length - 2; genIndex >= 0; genIndex--) {
            const genPersons = generations[genIndex];

            // FIRST PASS: Tính X cho những person có children
            genPersons.forEach((person) => {
                const personId = person._id!;
                const personSpouses = spouseMap.get(personId) || [];
                const numSpouses = personSpouses.length;

                if (numSpouses === 0) {
                    return; // Skip for now, will calculate later
                }

                // SORT SPOUSES THEO THỨ TỰ
                const sortedSpouses = [...personSpouses].sort((a, b) => {
                    const orderA = a.husbandOrder || a.wifeOrder || 0;
                    const orderB = b.husbandOrder || b.wifeOrder || 0;
                    if (orderA !== orderB) return orderA - orderB;

                    if (a.marriageDate && b.marriageDate) {
                        return new Date(a.marriageDate).getTime() - new Date(b.marriageDate).getTime();
                    }
                    return 0;
                });

                // Tính X cho từng spouse relationship (mỗi spouse ở giữa children của nó)
                const spouseXArray: number[] = [];

                sortedSpouses.forEach((spouse, idx) => {
                    const spouseId = spouse._id!;
                    const children = childrenMap.get(spouseId) || [];

                    if (children.length > 0) {
                        // Lấy X positions của children
                        const childPositions = children
                            .map((pc) => {
                                const childId = typeof pc.child === 'string' ? pc.child : pc.child._id;
                                return childId ? nodeXPositions.get(childId) : undefined;
                            })
                            .filter((x) => x !== undefined) as number[];

                        if (childPositions.length > 0) {
                            // Spouse X = trung điểm các children của spouse này
                            const minChildX = Math.min(...childPositions);
                            const maxChildX = Math.max(...childPositions);
                            const spouseX = (minChildX + maxChildX) / 2;
                            spouseXArray.push(spouseX);
                            relationshipXPositions.set(spouseId, spouseX);

                            // Lưu spouse node X
                            const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
                            const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;
                            const spousePersonId = husbandId === personId ? wifeId : husbandId;
                            const spouseGen = personGeneration.get(spousePersonId!);

                            if (spouseGen === undefined) {
                                const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${personId}_${idx}`;
                                spouseNodeXPositions.set(uniqueSpouseNodeId, spouseX);
                            }
                        } else {
                            // Không có child position, dùng fallback sequential
                            const fallbackX = 100 + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                            spouseXArray.push(fallbackX);
                            relationshipXPositions.set(spouseId, fallbackX);
                        }
                    } else {
                        // Không có children, dùng fallback sequential
                        const fallbackX = 100 + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                        spouseXArray.push(fallbackX);
                        relationshipXPositions.set(spouseId, fallbackX);
                    }
                });

                // Person X = trung điểm tất cả spouse positions
                if (spouseXArray.length > 0) {
                    const minSpouseX = Math.min(...spouseXArray);
                    const maxSpouseX = Math.max(...spouseXArray);
                    const personX = (minSpouseX + maxSpouseX) / 2;
                    nodeXPositions.set(personId, personX);
                }
            });

            // SECOND PASS: Tính X cho những person không có children
            // Layout theo thứ tự trong generation array với spacing hợp lý
            let currentX = 100;
            genPersons.forEach((person) => {
                const personId = person._id!;

                if (nodeXPositions.has(personId)) {
                    // Đã có X position từ first pass
                    const existingX = nodeXPositions.get(personId)!;
                    currentX = Math.max(currentX, existingX + PERSON_WIDTH + HORIZONTAL_GAP);
                } else {
                    // Chưa có X, tính dựa trên currentX
                    nodeXPositions.set(personId, currentX);

                    currentX += PERSON_WIDTH + HORIZONTAL_GAP;
                }
            });
        }

        // Bước 2: Vẽ nodes với X positions đã tính

        // TÍNH MIN/MAX X TOÀN CỤC cho tất cả generations
        const globalMinX: number[] = [];
        const globalMaxX: number[] = [];

        generations.forEach((genPersons) => {
            genPersons.forEach((p) => {
                const personX = nodeXPositions.get(p._id!);
                if (personX !== undefined) {
                    globalMinX.push(personX);
                    globalMaxX.push(personX);
                }

                const personSpouses = spouseMap.get(p._id!) || [];
                personSpouses.forEach((spouse) => {
                    const relX = relationshipXPositions.get(spouse._id!);
                    if (relX !== undefined) {
                        globalMinX.push(relX);
                        globalMaxX.push(relX);
                    }
                });
            });
        });

        const absoluteMinX = globalMinX.length > 0 ? Math.min(...globalMinX) : 100;
        const absoluteMaxX = globalMaxX.length > 0 ? Math.max(...globalMaxX) : 100;
        const groupPadding = 100;
        const globalGroupX = Math.max(50, absoluteMinX - groupPadding);
        const globalGroupWidth = absoluteMaxX - absoluteMinX + PERSON_WIDTH + 2 * groupPadding;

        generations.forEach((genPersons, genIndex) => {
            genPersons.forEach((person) => {
                const personId = person._id!;
                const personGender = mapGender(person.gender);
                const personSpouses = spouseMap.get(personId) || [];
                const numSpouses = personSpouses.length;

                // LẤY X POSITION ĐÃ TÍNH TỪ BƯỚC 1
                const personX = nodeXPositions.get(personId) || 100;

                // VẼ PERSON NODE
                if (!createdNodes.has(personId)) {
                    createdNodes.add(personId);
                    newNodes.push({
                        id: personId,
                        type: 'person',
                        position: { x: personX, y: OFFSET_PERSON },
                        data: {
                            id: personId,
                            cccd: person.cccd || '',
                            name: person.name,
                            avatar: person.avatar || '',
                            gender: personGender,
                            birth: person.birth,
                            death: person.death,
                            isDead: person.isDead || false,
                            address: person.address || '',
                            desc: person.desc || '',
                        },
                        sourcePosition: Position.Bottom,
                        targetPosition: Position.Top,
                        parentId: `gen${genIndex}`,
                    } as TPersionNode);
                }

                // VẼ CÁC QUAN HỆ VỢ/CHỒNG SYMMETRIC DƯỚI PERSON
                // CHỈ VẼ RELATIONSHIP NẾU CHƯA ĐƯỢC VẼ (tránh vẽ lại khi xử lý spouse ở gen khác)
                personSpouses.forEach((spouse, spouseIdx) => {
                    const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
                    const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;
                    const spousePersonId = husbandId === personId ? wifeId : husbandId;
                    const spousePerson = personMap.get(spousePersonId!);

                    if (!spousePerson) return;

                    const relationshipId = `R_${spouse._id}`;
                    const spouseId = spouse._id!;

                    // CHỈ VẼ RELATIONSHIP NẾU CHƯA TỒN TẠI
                    if (createdNodes.has(relationshipId)) {
                        // Relationship đã được vẽ rồi, skip
                        return;
                    }

                    // LẤY X POSITIONS ĐÃ TÍNH TỪ BƯỚC 1
                    const relationshipX = relationshipXPositions.get(spouseId) || 100 + spouseIdx * (PERSON_WIDTH + HORIZONTAL_GAP);
                    const spouseX = relationshipX; // Spouse và relationship có cùng X

                    // Relationship width bây giờ = Person width = 120, không cần offset
                    // Center của cả 2 đã thẳng hàng

                    // Relationship node (hình thoi) - THẲNG HÀNG với person và spouse nodes
                    createdNodes.add(relationshipId);
                    newNodes.push({
                        id: relationshipId,
                        type: 'relationship',
                        position: { x: relationshipX, y: OFFSET_RELATIONSHIP },
                        data: {
                            top: personGender,
                            husbandOrder: spouse.husbandOrder || 1,
                            wifeOrder: spouse.wifeOrder || 1,
                            marriageDate: spouse.marriageDate,
                            divorceDate: spouse.divorceDate,
                        },
                        parentId: `gen${genIndex}`,
                    } as TRelationshipNode);

                    // Edge: person -> relationship
                    const edge1Id = `${personId}_to_${relationshipId}`;
                    if (!createdEdges.has(edge1Id)) {
                        createdEdges.add(edge1Id);
                        newEdges.push({
                            id: edge1Id,
                            source: personId,
                            target: relationshipId,
                            sourceHandle: 'sb',
                            targetHandle: 'tt',
                            type: 'smoothstep',
                            style: { strokeWidth: 2 },
                        });
                    }

                    // CHỈ VẼ SPOUSE NODE NẾU NGƯỜI ĐÓ KHÔNG THUỘC CÂY GEN (không phải person chính trong generations)
                    // Nếu spouse này đã là person trong một thế hệ khác, dùng ID gốc để connect
                    const spouseGen = personGeneration.get(spousePersonId!);
                    let targetSpouseId: string;

                    if (spouseGen !== undefined) {
                        // Spouse là person chính trong cây gen, dùng ID gốc
                        targetSpouseId = spousePersonId!;
                    } else {
                        // Spouse không phải person chính, vẽ spouse node mới
                        const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${personId}_${spouseIdx}`;
                        targetSpouseId = uniqueSpouseNodeId;

                        if (!createdNodes.has(uniqueSpouseNodeId)) {
                            createdNodes.add(uniqueSpouseNodeId);

                            newNodes.push({
                                id: uniqueSpouseNodeId,
                                type: 'person',
                                position: { x: spouseX, y: OFFSET_SPOUSE },
                                data: {
                                    id: spousePersonId!,
                                    cccd: spousePerson.cccd || '',
                                    name: spousePerson.name,
                                    avatar: spousePerson.avatar || '',
                                    gender: mapGender(spousePerson.gender),
                                    birth: spousePerson.birth,
                                    death: spousePerson.death,
                                    isDead: spousePerson.isDead || false,
                                    address: spousePerson.address || '',
                                    desc: spousePerson.desc || '',
                                },
                                sourcePosition: Position.Bottom,
                                targetPosition: Position.Top,
                                parentId: `gen${genIndex}`,
                            } as TPersionNode);
                        }
                    }

                    // Edge: relationship -> spouse (dùng targetSpouseId đã xác định)
                    const edge2Id = `${relationshipId}_to_${targetSpouseId}`;
                    if (!createdEdges.has(edge2Id)) {
                        createdEdges.add(edge2Id);
                        newEdges.push({
                            id: edge2Id,
                            source: relationshipId,
                            target: targetSpouseId,
                            sourceHandle: 'sb',
                            targetHandle: 'tt',
                            type: 'smoothstep',
                            style: { strokeWidth: 2 },
                        });
                    }

                    // Edges to children - NỐI TỪ SPOUSE NODE (không phải relationship)
                    // Children phải được nối từ spouse (hàng 3) chứ không phải từ relationship (hàng 2)
                    const children = childrenMap.get(spouse._id!) || [];
                    children.forEach((pc) => {
                        const childId = typeof pc.child === 'string' ? pc.child : pc.child._id;
                        if (childId) {
                            const edge3Id = `${targetSpouseId}_to_child_${childId}`;
                            if (!createdEdges.has(edge3Id)) {
                                createdEdges.add(edge3Id);
                                newEdges.push({
                                    id: edge3Id,
                                    source: targetSpouseId, // NỐI TỪ SPOUSE, KHÔNG PHẢI RELATIONSHIP
                                    target: childId,
                                    sourceHandle: 'sb',
                                    targetHandle: 'tt',
                                    type: 'smoothstep',
                                    animated: true,
                                    style: { strokeWidth: 2 },
                                });
                            }
                        }
                    });
                });
            });

            // Generation group - SỬ DỤNG GLOBAL GROUP X để tất cả generations align
            newNodes.unshift({
                id: `gen${genIndex}`,
                type: 'group',
                data: { label: `Thế hệ ${genIndex + 1}` },
                position: { x: globalGroupX, y: currentY - 50 },
                style: {
                    width: globalGroupWidth,
                    height: GEN_VERTICAL_SPACE,
                    backgroundColor: 'rgba(255, 200, 200, 0.08)', // Hồng nhạt rõ hơn
                    border: '1px dashed rgba(255, 100, 100, 0.6)', // Đỏ nhạt rõ hơn
                },
            });
            currentY += GEN_VERTICAL_SPACE + GEN_GAP;
        });

        setNodes(newNodes);
        setEdges(newEdges);
    };

    const loadAllData = async () => {
        try {
            const [personsData, spousesData, parentChildsData] = await Promise.all([personService.getAllPersons(), spouseService.getAllSpouses(), parentChildService.getAllParentChildRelationships()]);
            setPersons(personsData);
            setSpouses(spousesData);
            setParentChilds(parentChildsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleAddSpouseFromPerson = (person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(false);
        setAddSpouseModalOpen(true);
    };

    const handleAddChildFromSpouse = (spouseId: string) => {
        setSelectedSpouseIdForChild(spouseId);
        setPersonDetailModalOpen(false);
        setAddChildModalOpen(true);
    };

    return (
        <div style={{ width: '100vw', height: '100svh' }}>
            <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
            </ReactFlow>

            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={() => setPersonDetailModalOpen(false)}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
            />
            <AddSpouseModal
                isOpen={addSpouseModalOpen}
                onClose={() => setAddSpouseModalOpen(false)}
                onSuccess={() => {
                    loadAllData();
                    setAddSpouseModalOpen(false);
                    setPersonDetailModalOpen(true);
                }}
                person={selectedPerson}
            />
            <AddChildModal
                isOpen={addChildModalOpen}
                onClose={() => setAddChildModalOpen(false)}
                onSuccess={() => {
                    loadAllData();
                    setAddChildModalOpen(false);
                    setPersonDetailModalOpen(true);
                }}
                spouseId={selectedSpouseIdForChild}
            />
        </div>
    );
}
