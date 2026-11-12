import { LegacyPage } from '../../components/legacy/LegacyPage';
import { LegacyRuntime } from '../../components/legacy/LegacyRuntime';

export default function AdminPage() {
  return (
    <>
      <LegacyRuntime page="admin" />
      <LegacyPage name="admin" />
    </>
  );
}
