import { Heading, Body } from '@/shared/components/Typography';

export const metadata = {
    title: 'Điều khoản dịch vụ | EduKids',
    description: 'Các quy định khi tham gia cộng đồng học viện EduKids.',
};

export default function TermsPage() {
    return (
        <article className="prose prose-slate dark:prose-p:text-body dark:prose-headings:text-heading max-w-none">
            <Heading level={2} className="text-4xl text-primary mb-8 text-center pb-8 border-b border-border font-heading font-bold">
                Điều khoản dịch vụ
            </Heading>

            <Body className="text-lg text-muted mb-10 italic text-center">
                Hiệu lực từ: Tháng 10, 2023
            </Body>

            <div className="space-y-8">
                <section>
                    <Heading level={2} className="text-2xl text-primary mb-3">1. Chấp thuận điều khoản</Heading>
                    <Body className="mb-4">
                        Bằng việc đăng ký tài khoản và cho phép trẻ sử dụng môi trường học tập EduKids, Phụ huynh xác nhận đã đọc, hiểu và đồng ý toàn bộ các điều khoản được quy định dưới đây. Tài khoản học tập là tài khoản định danh (Dựa trên số điện thoại/Email của phụ huynh) và không được phép chuyển nhượng, bán lại.
                    </Body>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-primary mb-3">2. Trách nhiệm của Phụ huynh</Heading>
                    <ul className="list-disc pl-6 space-y-2 text-body">
                        <li>Bảo mật thông tin đăng nhập, không chia sẻ cho bên thứ ba.</li>
                        <li>Giám sát thời lượng sử dụng thiết bị điện tử của trẻ em (EduKids khuyến nghị không quá 45 phút/ngày đối với trẻ dưới 7 tuổi).</li>
                        <li>Đăng ký độ tuổi thật của bé để AI có lộ trình đánh giá từ vựng và câu chuyện phù hợp.</li>
                    </ul>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-primary mb-3">3. Quy chế Gamification (Bảng xếp hạng vàng)</Heading>
                    <Body className="mb-4">
                        Để đảm bảo tính công bằng, EduKids ứng dụng AI để đo lường tiến độ học thực tế. Mọi hành vi dùng tool tự động (auto-clicker) hoặc nhờ người lớn học hộ để &quot;cày Kim Cương&quot; hoặc chiếm Top Bảng Vàng nếu bị hệ thống phát hiện sẽ dẫn đến việc:
                    </Body>
                    <ul className="list-disc pl-6 space-y-2 text-body">
                        <li>Reset lại toàn bộ điểm số của tuần đó.</li>
                        <li>Đình chỉ khả năng hiển thị trên Bảng xếp hạng Quốc gia trong 7 ngày.</li>
                    </ul>
                    <Body className="mt-4 italic text-sm text-muted">
                        * Mục đích của Bảng xếp hạng là khuyến khích các bé đua tài vui vẻ, chứ không phải áp lực thành tích.
                    </Body>
                </section>

                <section>
                    <Heading level={2} className="text-2xl text-primary mb-3">4. Chính Sách Hoàn Tiền</Heading>
                    <Body className="mb-4">
                        Chúng tôi tự tin vào chất lượng chương trình. Phụ huynh có thể yêu cầu hoàn trả 100% học phí (Gói 1 năm hoặc Trọn đời) trong vòng <b>07 ngày đầu tiên</b> tính từ lúc kích hoạt thành công nếu cảm thấy bé không hứng thú, với điều kiện thời lượng học chưa vượt quá 10 giờ.
                    </Body>
                </section>
            </div>
        </article>
    );
}
