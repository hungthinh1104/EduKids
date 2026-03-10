import { Body, Display } from '@/shared/components/Typography';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata = {
    title: 'Câu hỏi thường gặp | EduKids',
    description: 'Giải đáp các thắc mắc phổ biến của phụ huynh về EduKids.',
};

const faqs = [
    {
        question: "EduKids có phù hợp cho bé chưa biết gì về Tiếng Anh không?",
        answer: "Hoàn toàn phù hợp! EduKids có lộ trình thiết kế riêng cho người mới bắt đầu (Level 0). Trẻ sẽ được tiếp xúc qua hình ảnh động và âm thanh vô cùng tự nhiên trước khi ép buộc ghi nhớ mặt chữ."
    },
    {
        question: "Một tài khoản có thể dùng cho mấy bé?",
        answer: "Mỗi tài khoản được cấp quyền tạo tối đa 3 hồ sơ học tập (Profiles) hoàn toàn độc lập với nhau. Mỗi bé sẽ có tiến độ học, bảng điểm và tủ đồ kim cương riêng biệt mà không ảnh hưởng lẫn nhau."
    },
    {
        question: "Tính năng nhận diện giọng nói AI có chính xác không?",
        answer: "Hệ thống AI của chúng tôi được huấn luyện đặc biệt trên phổ giọng của trẻ em Châu Á, giúp nhận diện độ chính xác lên tới 95% và tự động bóc tách các lỗi sai âm cuối (ending sounds) mà bé người Việt hay gặp phải."
    },
    {
        question: "Tôi có thể theo dõi tiến độ học của con như thế nào?",
        answer: "Ba mẹ có thể truy cập 'Góc Phụ Huynh' bất kỳ lúc nào để xem báo cáo chi tiết. Ngoài ra, thứ 6 hàng tuần hệ thống sẽ gửi một bảng tổng kết ngắn gọn về số từ vựng bé mới học được và số thời gian bé đã dùng qua Zalo hoặc Email."
    },
    {
        question: "Phần mềm có chứa quảng cáo không?",
        answer: "Sự an toàn và tập trung của trẻ là số một. EduKids cam kết 100% không chứa bất kỳ quảng cáo bên thứ 3 nào dưới mọi hình thức, kể cả trong phiên bản dùng thử miễn phí."
    }
];

export default function FAQPage() {
    return (
        <main className="min-h-screen pt-40 pb-24 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-20 right-10 w-64 h-64 bg-warning-light rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse-glow" />
            <div className="absolute bottom-40 left-10 w-72 h-72 bg-primary-light rounded-full mix-blend-multiply blur-3xl opacity-30" />

            <div className="max-w-4xl mx-auto relative z-10 w-full px-4 lg:px-0">
                <div className="text-center mb-16">
                    <Display className="mb-6 text-heading">
                        Câu Hỏi <span className="text-transparent bg-clip-text gradient-candy">Thường Gặp</span>
                    </Display>
                    <Body size="lg" className="text-body max-w-2xl mx-auto">
                        Hợp tuyển các giải đáp chi tiết nhất dành cho phụ huynh trước và sau khi tham gia đồng hành cùng học viện EduKids.
                    </Body>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border-4 border-border shadow-xl relative">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                            <AccordionItem value={`item-${i}`} key={i} className="border-b-2 border-border last:border-0">
                                <AccordionTrigger className="text-left font-heading text-xl text-primary font-bold hover:no-underline hover:text-primary-dark transition-colors py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-lg text-body pb-6 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </main>
    );
}
