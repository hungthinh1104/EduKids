import { Heading, Body } from '@/shared/components/Typography';

export const metadata = {
    title: 'Chính sách bảo mật | EduKids',
    description: 'Trách nhiệm và cam kết của EduKids trong việc bảo vệ dữ liệu học tập của trẻ.',
};

export default function PrivacyPolicyPage() {
    return (
        <article className="prose prose-slate dark:prose-p:text-body dark:prose-headings:text-heading max-w-none">
            <Heading level={2} className="text-4xl text-primary mb-8 text-center pb-8 border-b border-border font-heading font-bold">
                Chính sách bảo mật
            </Heading>

            <Body className="text-lg text-muted mb-10 italic text-center">
                Cập nhật lần cuối: Tháng 10, 2023
            </Body>

            <div className="space-y-8">
                <section>
                    <Heading level={2} className="text-2xl text-secondary mb-4 flex items-center gap-2">
                        <span className="bg-secondary/10 w-8 h-8 rounded-full flex items-center justify-center text-secondary text-sm">1</span>
                        Cam kết bảo vệ trẻ em
                    </Heading>
                    <Body>
                        Tại EduKids, sự an toàn trực tuyến của trẻ em là ưu tiên cao nhất. Chúng tôi cam kết tuyệt đối không thu thập dữ liệu nhạy cảm của các bé (chẳng hạn như địa chỉ nhà, số điện thoại riêng) dưới bất kỳ hình thức nào. Hệ thống chỉ yêu cầu email của phụ huynh để khởi tạo tài khoản quản lý.
                    </Body>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-success mb-4 flex items-center gap-2">
                        <span className="bg-success/10 w-8 h-8 rounded-full flex items-center justify-center text-success text-sm">2</span>
                        Dữ liệu phát âm AI được xử lý như thế nào?
                    </Heading>
                    <Body>
                        Tính năng Luyện Phát Âm yêu cầu sử dụng Microphone. Giọng nói của bé được gửi đến máy chủ AI chỉ để **chấm điểm ngay lập tức** và phản hồi kết quả mỉm cười. EduKids **không lưu trữ vĩnh viễn** bất kỳ file ghi âm nào của trẻ trên server sau khi quá trình chấm điểm kết thúc nhằm bảo vệ quyền riêng tư tuyệt đối.
                    </Body>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-accent mb-4 flex items-center gap-2">
                        <span className="bg-accent/10 w-8 h-8 rounded-full flex items-center justify-center text-accent text-sm">3</span>
                        Tuyệt đối không có Quảng Cáo
                    </Heading>
                    <Body>
                        Nền tảng trả phí của EduKids tự hào xây dựng một môi trường &quot;Sạch&quot;. Chúng tôi KHÔNG cho phép bất kỳ đối tác bên thứ ba nào hiển thị nội dung quảng cáo, pop-up, hay thu thập cookie quảng cáo trên ứng dụng của trẻ. Bé được tận hưởng 100% thời lượng cho việc thẩm thấu Tiếng Anh.
                    </Body>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-warning mb-4 flex items-center gap-2">
                        <span className="bg-warning/10 w-8 h-8 rounded-full flex items-center justify-center text-warning text-sm">4</span>
                        Liên hệ với chúng tôi
                    </Heading>
                    <Body>
                        Nếu quý phụ huynh có bất kỳ thắc mắc nào về chính sách quyền riêng tư này, vui lòng liên hệ đội ngũ Hỗ trợ Phụ huynh qua email: <a href="mailto:privacy@edukids.vn" className="text-primary hover:underline font-bold">privacy@edukids.vn</a>.
                    </Body>
                </section>
            </div>
        </article>
    );
}
