import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async create(createUserDto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
        });
        const user = await createdUser.save();
        const { password, ...result } = user.toObject();
        return result;
    }

    async findByUsername(username: string): Promise<UserDocument | undefined> {
        return this.userModel.findOne({ name: username }).exec();
    }

    async findOne(id: string) {
        return this.userModel.findById(id).select('-password').exec();
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).select('-password').exec();
    }

    async remove(id: string) {
        return this.userModel.findByIdAndDelete(id).exec();
    }

    async findAll() {
        return this.userModel.find().select('-password').exec();
    }
}
