import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { AttributesService } from '../services/attributes.service';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Post()
  createAttribute(@Request() req, @Body('name') name: string) {
    return this.service.createAttribute(req.user.organizationId, name);
  }

  @Post(':id/values')
  createAttributeValue(@Request() req, @Param('id') id: string, @Body('value') value: string) {
    return this.service.createAttributeValue(req.user.organizationId, id, value);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.organizationId);
  }
}
