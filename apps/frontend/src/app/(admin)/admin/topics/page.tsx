import { redirect } from 'next/navigation';

export default function AdminTopicsLegacyRedirectPage() {
  redirect('/admin/topics-manage');
}
