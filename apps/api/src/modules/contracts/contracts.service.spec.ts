import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractsService, CreateContractDto, SignContractDto } from './contracts.service';

describe('ContractsService', () => {
  let service: ContractsService;

  const mockPrisma = {
    client: { findFirst: jest.fn() },
    digitalContract: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateContractDto = {
      clientId: 'client-1',
      title: 'Contrato de Prestação de Serviços',
      content: 'Termos e condições...',
    };

    it('creates a digital contract', async () => {
      const created = { id: 'ct-1', ...dto, signedAt: null, signatureName: null };
      mockPrisma.digitalContract.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockPrisma.digitalContract.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  // ─── findForClient ────────────────────────────────────────────────────────

  describe('findForClient', () => {
    it('returns contracts ordered by creation date desc', async () => {
      const contracts = [{ id: 'ct-1', clientId: 'client-1' }];
      mockPrisma.digitalContract.findMany.mockResolvedValue(contracts);

      const result = await service.findForClient('client-1');

      expect(mockPrisma.digitalContract.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(contracts);
    });
  });

  // ─── findMy ───────────────────────────────────────────────────────────────

  describe('findMy', () => {
    const userId = 'user-1';

    it('resolves clientId and returns contracts', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      const contracts = [{ id: 'ct-1' }];
      mockPrisma.digitalContract.findMany.mockResolvedValue(contracts);

      const result = await service.findMy(userId);

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual(contracts);
    });

    it('returns empty array when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      const result = await service.findMy(userId);

      expect(result).toEqual([]);
    });
  });

  // ─── sign ─────────────────────────────────────────────────────────────────

  describe('sign', () => {
    const id = 'ct-1';
    const userId = 'user-1';
    const dto: SignContractDto = { signatureName: 'João Silva' };

    it('signs the contract and sets signedAt', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      mockPrisma.digitalContract.findFirst.mockResolvedValue({
        id, clientId: 'client-1', signedAt: null,
      });
      const signed = { id, signedAt: new Date(), signatureName: dto.signatureName };
      mockPrisma.digitalContract.update.mockResolvedValue(signed);

      const result = await service.sign(id, userId, dto);

      expect(mockPrisma.digitalContract.update).toHaveBeenCalledWith({
        where: { id },
        data: { signedAt: expect.any(Date), signatureName: dto.signatureName },
      });
      expect(result).toEqual(signed);
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.sign(id, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when contract does not belong to client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      mockPrisma.digitalContract.findFirst.mockResolvedValue(null);

      await expect(service.sign(id, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when contract already signed', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
      mockPrisma.digitalContract.findFirst.mockResolvedValue({
        id, clientId: 'client-1', signedAt: new Date(),
      });

      await expect(service.sign(id, userId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the contract by id', async () => {
      mockPrisma.digitalContract.delete.mockResolvedValue({ id: 'ct-1' });

      await service.delete('ct-1');

      expect(mockPrisma.digitalContract.delete).toHaveBeenCalledWith({ where: { id: 'ct-1' } });
    });
  });
});
