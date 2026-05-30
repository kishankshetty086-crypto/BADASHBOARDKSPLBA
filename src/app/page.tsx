import { cookies } from 'next/headers';
import TeamSelection from '@/components/TeamSelection';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const cookieStore = await cookies();
  const teamCookie = cookieStore.get('zoho_updater_team');
  const team = teamCookie?.value;

  if (!team) {
    return <TeamSelection />;
  }

  return <Dashboard team={team} />;
}
