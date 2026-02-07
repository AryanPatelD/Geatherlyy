import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataManagementService } from './data-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('data-management')
@Controller('data-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Get('clubs/:clubId/summary')
  @ApiOperation({ summary: 'Get summary of data for a club (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Returns summary of data that would be deleted' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async getClubDataSummary(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Request() req,
  ) {
    return this.dataManagementService.getClubDataSummary(clubId, req.user.id);
  }

  @Delete('clubs/:clubId/truncate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Truncate all data for a club except users (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Data truncated successfully' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async truncateClubData(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Request() req,
  ) {
    return this.dataManagementService.truncateClubData(clubId, req.user.id);
  }
}
