// This file is no longer needed with Appwrite authentication.
// User profile can be managed in the dashboard settings.
import { redirect } from 'next/navigation';

export default function UserProfilePage() {
  redirect('/dashboard/settings');
}
