import { jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock los módulos
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

let app;

beforeAll(async () => {
    // Importar la app de prueba
    const appModule = await import("../test-app.js");
    app = appModule.default;
});

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Debe retornar 400 si la validación falla", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "", password: "" });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test("Debe retornar 401 si el usuario no existe", async () => {
        // bcrypt.compare siempre devolverá false para usuario no existente
        bcrypt.compare.mockResolvedValue(false);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nonexistent@test.com", password: "123456" });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Invalid credentials");
    });

    test("Debe retornar 401 si la contraseña es incorrecta", async () => {
        bcrypt.compare.mockResolvedValue(false);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@test.com", password: "wrongpass" });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Invalid credentials");
    });

    test("Debe retornar token y usuario al logear correctamente", async () => {
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("FAKE_TOKEN");

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@test.com", password: "correctpass" });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBe("FAKE_TOKEN");
        expect(res.body.user.email).toBe("test@test.com");
    });

    test("Debe manejar errores internos y retornar 500", async () => {
        // Simular error en bcrypt.compare
        bcrypt.compare.mockRejectedValue(new Error("DB Error"));

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@test.com", password: "123456" });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe("Server error");
    });
});