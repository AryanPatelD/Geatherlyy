import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class LeaderboardsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getGlobalLeaderboard(limit: number = 50): Promise<any[]> {
    const cacheKey = 'leaderboard:global';
    const cached = await this.redis.getLeaderboard(cacheKey);

    if (cached) {
      return cached as any[];
    }

    // Calculate points based on:
    // - Quiz scores (primary)
    // - Fewer clubs joined (tiebreaker for same score)
    // - More quizzes completed (secondary tiebreaker)
    const leaderboard = await this.prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.role,
        COALESCE(SUM(qa.score), 0) as total_score,
        COUNT(DISTINCT cm.id) as clubs_joined,
        COUNT(DISTINCT qa.id) as quizzes_completed,
        COALESCE(AVG(qa.percentage), 0) as avg_percentage
      FROM "users" u
      LEFT JOIN "quiz_attempts" qa ON u.id = qa."userId" AND qa."attemptedAt" IS NOT NULL
      LEFT JOIN "club_members" cm ON u.id = cm."userId"
      WHERE u.role IN ('MEMBER', 'COORDINATOR')
      GROUP BY u.id
      ORDER BY 
        total_score DESC, 
        clubs_joined ASC,
        quizzes_completed DESC,
        avg_percentage DESC
      LIMIT ${limit}
    `;

    const formattedLeaderboard = (leaderboard as any[]).map((item, index) => ({
      rank: index + 1,
      userId: item.id,
      name: item.name,
      email: item.email,
      avatar: item.avatar,
      role: item.role,
      totalScore: Number(item.total_score),
      clubsJoined: Number(item.clubs_joined),
      quizzesCompleted: Number(item.quizzes_completed),
      avgPercentage: Number(item.avg_percentage).toFixed(2),
    }));

    await this.redis.setLeaderboard(cacheKey, formattedLeaderboard);

    return formattedLeaderboard;
  }

  async getClubLeaderboard(clubId: number, limit: number = 30): Promise<any[]> {
    const cacheKey = `leaderboard:club:${clubId}`;
    const cached = await this.redis.getLeaderboard(cacheKey);

    if (cached) {
      return cached as any[];
    }

    // Leaderboard for specific club members
    // Ranking based on quiz performance within this club only
    const leaderboard = await this.prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.role,
        COALESCE(SUM(qa.score), 0) as total_score,
        COUNT(DISTINCT qa.id) as quizzes_completed,
        COALESCE(AVG(qa.percentage), 0) as avg_percentage,
        cm."joinedAt" as joined_at
      FROM "users" u
      INNER JOIN "club_members" cm ON u.id = cm."userId" AND cm."clubId" = ${clubId}
      LEFT JOIN "quiz_attempts" qa ON u.id = qa."userId" 
        AND qa."attemptedAt" IS NOT NULL
        AND qa."quizId" IN (
          SELECT id FROM "quizzes" WHERE "clubId" = ${clubId}
        )
      GROUP BY u.id, cm."joinedAt"
      ORDER BY 
        total_score DESC, 
        quizzes_completed DESC,
        avg_percentage DESC,
        joined_at ASC
      LIMIT ${limit}
    `;

    const formattedLeaderboard = (leaderboard as any[]).map((item, index) => ({
      rank: index + 1,
      userId: item.id,
      name: item.name,
      email: item.email,
      avatar: item.avatar,
      role: item.role,
      totalScore: Number(item.total_score),
      quizzesCompleted: Number(item.quizzes_completed),
      avgPercentage: Number(item.avg_percentage).toFixed(2),
      joinedAt: item.joined_at,
    }));

    await this.redis.setLeaderboard(cacheKey, formattedLeaderboard);

    return formattedLeaderboard;
  }

  async getUserRank(userId: number): Promise<any> {
    const leaderboard = await this.getGlobalLeaderboard(1000); // Get more data for accurate rank
    
    const userEntry = leaderboard.find(entry => entry.userId === userId);

    if (!userEntry) {
      return {
        rank: null,
        totalScore: 0,
        clubsJoined: 0,
        quizzesCompleted: 0,
      };
    }

    return userEntry;
  }

  async invalidateLeaderboards(): Promise<void> {
    await this.redis.del('leaderboard:global');
    // Invalidate all club leaderboards
    const clubs = await this.prisma.club.findMany({
      select: { id: true },
    });
    
    for (const club of clubs) {
      await this.redis.del(`leaderboard:club:${club.id}`);
    }
  }

  async exportGlobalLeaderboard(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Global Leaderboard');

    // Add title row
    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'Global Leaderboard';
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: 'center' };

    // Add date row
    worksheet.mergeCells('A2:F2');
    const dateRow = worksheet.getCell('A2');
    dateRow.value = `Generated on: ${new Date().toLocaleString()}`;
    dateRow.font = { size: 10, italic: true };
    dateRow.alignment = { horizontal: 'center' };

    // Add header row
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Rank',
      'Name',
      'Email',
      'Total Score',
      'Quizzes Completed',
      'Clubs Joined',
      'Average %',
    ]);
    
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Get leaderboard data
    const leaderboard = await this.getGlobalLeaderboard(100);

    // Add data rows
    leaderboard.forEach((entry) => {
      const row = worksheet.addRow([
        entry.rank,
        entry.name,
        entry.email,
        entry.totalScore,
        entry.quizzesCompleted,
        entry.clubsJoined,
        `${entry.avgPercentage}%`,
      ]);

      // Highlight top 3
      if (entry.rank === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' },
        };
      } else if (entry.rank === 2) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC0C0C0' },
        };
      } else if (entry.rank === 3) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCD7F32' },
        };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 10 },
      { width: 25 },
      { width: 30 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportClubLeaderboard(clubId: number): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Club Leaderboard');

      // Get club name
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        select: { name: true },
      });

      if (!club) {
        throw new Error(`Club with ID ${clubId} not found`);
      }

      // Add title row
      worksheet.mergeCells('A1:E1');
      const titleRow = worksheet.getCell('A1');
      titleRow.value = `${club?.name || 'Club'} Leaderboard`;
      titleRow.font = { size: 16, bold: true };
      titleRow.alignment = { horizontal: 'center' };

      // Add date row
      worksheet.mergeCells('A2:E2');
      const dateRow = worksheet.getCell('A2');
      dateRow.value = `Generated on: ${new Date().toLocaleString()}`;
      dateRow.font = { size: 10, italic: true };
      dateRow.alignment = { horizontal: 'center' };

      // Add header row
      worksheet.addRow([]);
      const headerRow = worksheet.addRow([
        'Rank',
        'Member Name',
        'Email',
        'Total Score',
        'Quizzes Completed',
        'Average %',
      ]);
      
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9B59B6' },
      };
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });

      // Get leaderboard data
      const leaderboard = await this.getClubLeaderboard(clubId, 100);

      // Add data rows
      leaderboard.forEach((entry) => {
        const row = worksheet.addRow([
          entry.rank,
          entry.name,
          entry.email,
          entry.totalScore,
          entry.quizzesCompleted,
          `${entry.avgPercentage}%`,
        ]);

        // Highlight top 3
        if (entry.rank === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFD700' },
          };
        } else if (entry.rank === 2) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC0C0C0' },
          };
        } else if (entry.rank === 3) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCD7F32' },
          };
        }
      });

      // Set column widths
      worksheet.columns = [
        { width: 10 },
        { width: 25 },
        { width: 30 },
        { width: 15 },
        { width: 20 },
        { width: 15 },
      ];

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error exporting club leaderboard:', error);
      throw error;
    }
  }
}
