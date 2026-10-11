import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('user/:userId')
  create(@Param('userId') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(userId, dto);
  }

  @Get('user/:userId')
  findAll(@Param('userId') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Get('user/:userId/:id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.categoriesService.findOne(userId, id);
  }

  @Patch('user/:userId/:id')
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(userId, id, dto);
  }

  @Delete('user/:userId/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('userId') userId: string, @Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(userId, id);
  }
}
