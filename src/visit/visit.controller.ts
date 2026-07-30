import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VisitService } from './visit.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Controller('visit')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Post()
  async create(@Body() createVisitDto: CreateVisitDto) {
    return await this.visitService.create(createVisitDto);
  }

  @Get()
  findAll() {
    return this.visitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitDto: UpdateVisitDto) {
    return this.visitService.update(+id, updateVisitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitService.remove(+id);
  }
}
