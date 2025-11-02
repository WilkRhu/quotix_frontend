'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DocumentValidation from '../../../components/DocumentValidation';
import { Role } from '../../../types/auth';
import { useAuth } from '../../../stories/authStore';

export default function LojistaDocumentosPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || ![Role.LOJISTA, Role.LOGIST].includes(user.role)) {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title="Validação de Documentos">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <DocumentValidation />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}