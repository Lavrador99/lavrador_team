import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { StatsService } from './stats.service';

describe('StatsService – getRevenueDashboard', () => {
  let service: StatsService;

  const mockAggregate = jest.fn();

  const mockPrisma = {
    invoice: { aggregate: mockAggregate },
  };

  const mockCache = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  // Helper: build the aggregate result prisma returns
  const agg = (amount: number | null, count: number) => ({
    _sum: { amount },
    _count: count,
  });

  describe('with real invoice data', () => {
    beforeEach(() => {
      // First 4 calls: monthPaid, yearPaid, pending, overdue (Promise.all)
      // Next 6 calls: monthly buckets (sequential)
      mockAggregate
        .mockResolvedValueOnce(agg(1200, 3))  // thisMonth
        .mockResolvedValueOnce(agg(8500, 20)) // thisYear
        .mockResolvedValueOnce(agg(600, 4))   // pending
        .mockResolvedValueOnce(agg(200, 1))   // overdue
        // 6 monthly buckets
        .mockResolvedValueOnce(agg(500, 0))
        .mockResolvedValueOnce(agg(700, 0))
        .mockResolvedValueOnce(agg(1100, 0))
        .mockResolvedValueOnce(agg(900, 0))
        .mockResolvedValueOnce(agg(400, 0))
        .mockResolvedValueOnce(agg(1200, 0));
    });

    it('returns correct thisMonth revenue and invoice count', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.thisMonth.revenue).toBe(1200);
      expect(result.thisMonth.invoices).toBe(3);
    });

    it('returns correct thisYear revenue and invoice count', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.thisYear.revenue).toBe(8500);
      expect(result.thisYear.invoices).toBe(20);
    });

    it('returns correct pendingValue', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.pendingValue).toBe(600);
    });

    it('returns correct overdueValue and overdueCount', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.overdueValue).toBe(200);
      expect(result.overdueCount).toBe(1);
    });

    it('returns monthlyChart with exactly 6 buckets', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.monthlyChart).toHaveLength(6);
    });

    it('last bucket in monthlyChart matches thisMonth revenue', async () => {
      const result = await service.getRevenueDashboard();
      const last = result.monthlyChart[result.monthlyChart.length - 1];

      expect(last.revenue).toBe(1200);
    });
  });

  describe('when database has no invoices (all nulls)', () => {
    beforeEach(() => {
      mockAggregate.mockResolvedValue(agg(null, 0));
    });

    it('defaults revenue fields to 0 instead of null', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.thisMonth.revenue).toBe(0);
      expect(result.thisYear.revenue).toBe(0);
      expect(result.pendingValue).toBe(0);
      expect(result.overdueValue).toBe(0);
    });

    it('defaults invoice counts to 0', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.thisMonth.invoices).toBe(0);
      expect(result.overdueCount).toBe(0);
    });

    it('returns 6 zero-revenue buckets in monthlyChart', async () => {
      const result = await service.getRevenueDashboard();

      expect(result.monthlyChart).toHaveLength(6);
      expect(result.monthlyChart.every((b) => b.revenue === 0)).toBe(true);
    });
  });

  describe('prisma call structure', () => {
    beforeEach(() => {
      mockAggregate.mockResolvedValue(agg(0, 0));
    });

    it('queries PAID invoices for thisMonth with paidAt filter', async () => {
      await service.getRevenueDashboard();

      const calls = mockAggregate.mock.calls;
      // First call (monthPaid) must filter by PAID status
      expect(calls[0][0]).toMatchObject({
        where: { status: 'PAID' },
        _sum: { amount: true },
      });
    });

    it('queries PENDING invoices for overdueCount with dueDate lt now', async () => {
      await service.getRevenueDashboard();

      const calls = mockAggregate.mock.calls;
      // Fourth call (overdue) must filter by PENDING + dueDate lt
      expect(calls[3][0]).toMatchObject({
        where: { status: 'PENDING', dueDate: expect.objectContaining({ lt: expect.any(Date) }) },
      });
    });

    it('makes exactly 10 aggregate calls (4 summary + 6 monthly)', async () => {
      await service.getRevenueDashboard();

      expect(mockAggregate).toHaveBeenCalledTimes(10);
    });
  });
});
