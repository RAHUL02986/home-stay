import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  await dbConnect();
  const user = await User.findById(session.user.id).select('name email phone whatsappBookingOptIn').lean();
  if (!user) redirect('/auth/login');

  return (
    <div className="flex min-h-svh flex-col bg-white">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Edit profile</h1>
            <p className="mt-2 text-sm text-slate-600">Update the name and phone number on your account.</p>
          </div>
          <ProfileForm
            initialProfile={{
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              whatsappBookingOptIn: user.whatsappBookingOptIn === true,
              isHost: session.user.role === 'host',
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
