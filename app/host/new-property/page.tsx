import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PropertyForm from '@/components/host/PropertyForm';
import Footer from '@/components/layout/Footer';
import { authOptions } from '@/lib/auth';

export default async function NewPropertyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'host') {
    redirect(session.user.role === 'admin' ? '/admin/dashboard' : '/guest/dashboard');
  }

  return (
    <div className="flex flex-col min-h-svh bg-white">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">List Your Property</h1>
            <p className="text-slate-600 mt-2">
              Publish your homestay or hotel in Dharamshala and start hosting travelers.
            </p>
          </div>
          <PropertyForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
