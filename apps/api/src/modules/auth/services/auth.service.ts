import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AuthTokens,
  JwtPayload,
  LoginDto,
  RegisterDto,
} from "../types/auth.dto";
import { EmailService } from "../../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Email já registado");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.CLIENT,
        client: {
          create: { name: dto.name },
        },
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(rawToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: rawToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new ForbiddenException("Refresh token inválido ou expirado");
    }

    // Rotate: apagar o token antigo
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "1h",
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: addDays(new Date(), 7),
      },
    });

    return { accessToken, refreshToken };
  }
  // Criação de utilizador pelo ADMIN (com dados clínicos)
  async createUser(dto: {
    email: string;
    password: string;
    role: string;
    name: string;
    birthDate?: string;
    phone?: string;
    notes?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Email já registado");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role === "ADMIN" ? Role.ADMIN : Role.CLIENT;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        ...(role === Role.CLIENT && {
          client: {
            create: {
              name: dto.name,
              birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
              phone: dto.phone,
              notes: dto.notes,
            },
          },
        }),
      },
      include: { client: true },
    });

    // Send welcome email (fire-and-forget)
    this.emailService.sendWelcome(dto.email, dto.name ?? dto.email.split('@')[0]).catch(() => {});

    return user;
  }
}
