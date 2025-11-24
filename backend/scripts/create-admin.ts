import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/modules/user/user.service';
import { UserRoles } from '../src/constants';

async function createAdmin() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userService = app.get(UserService);

    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    try {
        const existingAdmin = await userService.findByUsername(adminUsername);
        if (existingAdmin) {
            console.log('Admin user already exists.');
            // Optional: Reset password if needed, but for now just notify
        } else {
            await userService.create({
                name: adminUsername,
                password: adminPassword,
                email: 'admin@familytree.com',
                role: UserRoles.ADMIN,
            });
            console.log('------------------------------------------------');
            console.log('Admin user created successfully!');
            console.log(`Username: ${adminUsername}`);
            console.log(`Password: ${adminPassword}`);
            console.log('------------------------------------------------');
        }
    } catch (error) {
        console.error('Failed to create admin user:', error);
    } finally {
        await app.close();
    }
}

createAdmin();
