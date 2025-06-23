const request = require('supertest');
const app = require('../app');
const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: '.env.test' });

let testEmail = `test${Date.now()}@mail.com`;
let testEmail2 = `test2${Date.now()}@mail.com`;
let testPassword = 'password123';

let accessToken = '';
let refreshToken = '';

describe('Authentication Tests', () => {

    beforeAll(async () => {

        const hashedPassword = await bcrypt.hash(testPassword, 10);

        await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                email: testEmail2,
                password: hashedPassword,
                role: 'USER',
                verified: true
            }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testEmail } });
        await prisma.user.deleteMany({ where: { email: testEmail2 } });
        await prisma.$disconnect();
    });

    it("should register a new User", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                firstName: "Test",
                lastName: "User",
                email: testEmail,
                password: testPassword
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toMatch(/User registered successfully/i);
    });

    it("return 200 and user object on valid login", async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: testEmail2,
                password: testPassword,
            });

        refreshToken = response.body.refreshToken;
        accessToken = response.body.accessToken;

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testEmail2);
        expect(response.body).toHaveProperty('accessToken');
    });

    it("logout the user, clear refresh token cookie", async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send();

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Logged out successfully');

        const user = await prisma.user.findUnique({ where: { email: testEmail2 } });
        expect(user.refreshToken).toBeNull();

        const cookies = response.headers['set-cookie'] || [];
        const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
        expect(refreshTokenCookie).toBeDefined();
    });
});