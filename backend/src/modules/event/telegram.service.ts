import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TELEGRAM_MAX = 4000; // chừa biên dưới 4096

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(private readonly config: ConfigService) {}

    /** Chia mảng khối text thành các tin nhắn <= TELEGRAM_MAX, không cắt giữa khối. */
    buildMessages(blocks: string[], header: string): string[] {
        const messages: string[] = [];
        let current = header;
        for (const block of blocks) {
            if ((current + '\n\n' + block).length > TELEGRAM_MAX) {
                messages.push(current);
                current = block;
            } else {
                current = current ? current + '\n\n' + block : block;
            }
        }
        if (current) messages.push(current);
        return messages;
    }

    async send(messages: string[]): Promise<{ sent: number }> {
        const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
        const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
        if (!token || !chatId) {
            this.logger.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID chưa cấu hình — bỏ qua gửi');
            return { sent: 0 };
        }
        let sent = 0;
        for (const text of messages) {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
            });
            if (res.ok) sent++;
            else this.logger.error(`Telegram send failed: ${res.status} ${await res.text()}`);
        }
        return { sent };
    }
}
