'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DocumentUploadCards from '../../../components/DocumentUploadCards';
import { Role } from '../../../types/auth';
import { useAuth } from '../../../stories/authStore';

export default function ClienteDocumentosPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== Role.CLIENT) {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <ProtectedRoute requiredRoles={[Role.CLIENT]}>
      <DashboardLayout title="Validação de Documentos">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <DocumentUploadCards 
                clienteId={user?.id || ''} 
                onUploadComplete={() => {}} 
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}