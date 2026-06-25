import Image from 'next/image';
import { Person } from 'src/services/personService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';
import { getBirthYear } from '../utils';
import { SortDirection, SortField } from '../types';

interface PersonListProps {
    paginated: Person[];
    connectedIds: Set<string>;
    currentPage: number;
    pageSize: number;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onPersonClick: (person: Person) => void;
    canEdit: boolean;
    onPushEvent: (person: Person) => void;
}

export default function PersonList({ paginated, connectedIds, currentPage, pageSize, sortField, sortDirection, onSort, onPersonClick, canEdit, onPushEvent }: PersonListProps) {
    if (paginated.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <p className="text-lg font-medium">Không tìm thấy thành viên nào</p>
                <p className="text-sm text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                            #
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            onClick={() => onSort('name')}
                        >
                            <div className="flex items-center gap-1">
                                Thành viên
                                {sortField === 'name' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            onClick={() => onSort('birth')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Năm sinh
                                {sortField === 'birth' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            onClick={() => onSort('status')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Trạng thái
                                {sortField === 'status' && <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                            </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                            CCCD
                        </th>
                        {canEdit && (
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Sự kiện
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((person, idx) => {
                        const isIsolated = person._id ? !connectedIds.has(person._id) : false;
                        const isDeceased = person.isDead === true;
                        const avatarSrc = person.avatar?.trim() ? person.avatar : isMale(person.gender) ? Avatar_Male : Avatar_Female;
                        const birthYear = getBirthYear(person);
                        const rowNum = (currentPage - 1) * pageSize + idx + 1;
                        const borderColor = isMale(person.gender) ? 'border-blue-400' : 'border-pink-400';

                        return (
                            <tr
                                key={person._id ?? idx}
                                onClick={() => onPersonClick(person)}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${isIsolated ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                            >
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{rowNum}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 h-10 w-10 relative`}>
                                            <Image
                                                className={`rounded-full object-cover border-2 ${borderColor} ${isDeceased ? 'grayscale' : ''}`}
                                                src={avatarSrc}
                                                alt={person.name}
                                                fill
                                                sizes="40px"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className={`text-sm font-medium ${isDeceased ? 'text-gray-500' : 'text-gray-900'}`}>{person.name}</div>
                                            <div className="text-xs text-gray-500">{isMale(person.gender) ? 'Nam' : 'Nữ'}</div>
                                            {isIsolated && <div className="text-[10px] text-amber-600 font-medium mt-0.5 max-w-[150px] truncate">⚠️ Chưa có liên hệ</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-500">{birthYear || '—'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDeceased ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-800'}`}>
                                        {isDeceased ? 'Đã mất' : 'Còn sống'}
                                    </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">{person.cccd || '—'}</td>
                                {canEdit && (
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                        <button
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                onPushEvent(person);
                                            }}
                                            title="Tạo/cập nhật sự kiện giỗ & sinh nhật"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
                                                <path d="M8 2v3M16 2v3M3.5 9h17M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 13v3M10.5 14.5h3" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
