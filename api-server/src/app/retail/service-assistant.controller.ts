import { Controller, Post, Body } from '@nestjs/common';
import { ServiceAssistantService, AssistantQueryDto } from './service-assistant.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('public/service-assistant')
export class PublicServiceAssistantController {
  constructor(
    private readonly assistantService: ServiceAssistantService,
    private readonly prisma: PrismaService
  ) {}

  @Post('ask')
  async askAssistant(@Body() body: AssistantQueryDto) {
    const org = await this.prisma.organization.findFirst();
    return this.assistantService.answerCustomer(body, org?.id);
  }
}
