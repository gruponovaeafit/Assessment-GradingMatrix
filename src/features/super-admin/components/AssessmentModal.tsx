import React, { useState, useEffect } from 'react';
import { Button } from '@/components/UI/Button';
import { InputBox } from '@/components/UI/InputBox';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { type GrupoEstudiantil, type AdminUser, type Assessment } from '@/features/super-admin/schemas/superAdminSchemas';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isEdit: boolean;
  // Options
  gruposEstudiantiles: GrupoEstudiantil[];
  allAdmins: AdminUser[];
  activeAssessmentsByGroup: Record<number, number>; // maps grupoId -> activeAssessmentId
  // Initial Values
  initialAssessment?: Assessment | null;
  // Handlers
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number, password?: string) => Promise<void>;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  title,
  isEdit,
  gruposEstudiantiles,
  allAdmins,
  activeAssessmentsByGroup,
  initialAssessment,
  onSave,
  onDelete,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [grupoId, setGrupoId] = useState<number | ''>('');
  
  // Admin Logic
  const [reassignAdminId, setReassignAdminId] = useState<number | ''>('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Validation / Warning State
  const [warning, setWarning] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Global Confirm Modal for Deletion
  const { confirm, ConfirmModalComponent, setIsLoading: setConfirmLoading } = useConfirmModal();

  // Temporarily assuming standard "activo" logic if warning is needed. Wait, 'activoStatus' is missing.
  // In creation, it is active by default. In edit, it can change. Let's add an 'activo' toggle.
  const [activoStatus, setActivoStatus] = useState(true);
  
  // Derived state: admins available for the selected group
  const adminsForGroup = grupoId 
    ? allAdmins.filter(a => a.grupoNombre === gruposEstudiantiles.find(g => g.id === grupoId)?.nombre)
    : [];

  useEffect(() => {
    if (isOpen) {
      if (initialAssessment) {
        setNombre(initialAssessment.nombre);
        setDescripcion(initialAssessment.descripcion || '');
        setGrupoId(initialAssessment.grupoId || '');
        setActivoStatus(initialAssessment.activo);
        
        // Find existing admin for this assessment
        const currentAdmin = allAdmins.find(a => a.assessmentId === initialAssessment.id);
        if (currentAdmin) {
          setReassignAdminId(currentAdmin.id);
        } else {
          setReassignAdminId('');
        }
      } else {
        setNombre('');
        setDescripcion('');
        setGrupoId('');
        setReassignAdminId('');
        setActivoStatus(true);
      }
      setAdminEmail('');
      setAdminPassword('');
      setWarning(null);
      setEmailError(null);
      setPasswordError(null);
    }
  }, [isOpen, initialAssessment, allAdmins, gruposEstudiantiles]);

  if (!isOpen) return null;

  /** Validates an email — returns an error string or null if valid. */
  const validateEmail = (email: string): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return 'El correo es obligatorio';
    // Reject non-ASCII characters (emojis, accented letters, etc.)
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(trimmed)) return 'El correo contiene caracteres no permitidos (emojis o caracteres especiales)';
    // Reject embedded whitespace
    if (/\s/.test(trimmed)) return 'El correo no puede contener espacios';
    // Standard email regex: requires something@something.tld
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return 'El correo debe seguir el formato usuario@dominio.com';
    return null;
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : '';
    setGrupoId(val);
    setReassignAdminId(''); // Reset admin selection on group change
    
    // Check for multiple active assessments warning
    if (val !== '' && activoStatus && activeAssessmentsByGroup[val] && activeAssessmentsByGroup[val] !== initialAssessment?.id) {
       setWarning('ATENCIÓN: Ya existe un assessment activo para este grupo. Le recomendamos mantener solo uno.');
    } else {
       setWarning(null);
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) return;
    if (!grupoId) return;

    // Validate admin fields only when creating a new admin
    if (!isEdit && !reassignAdminId) {
      const emailErr = validateEmail(adminEmail);
      const pwdErr = !adminPassword.trim() ? 'La contraseña es obligatoria' : null;
      setEmailError(emailErr);
      setPasswordError(pwdErr);
      if (emailErr || pwdErr) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: initialAssessment?.id,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        grupoId,
        activo: activoStatus,
        admin: reassignAdminId ? { id: reassignAdminId } : { correo: adminEmail.trim().toLowerCase(), password: adminPassword }
      };
      await onSave(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initialAssessment) return;
    
    const assessmentName = initialAssessment.nombre;
    const deleteMessage = (
      <div className="space-y-4 text-[color:var(--color-text)]">
        <p>
          Estás a punto de eliminar permanentemente el assessment{' '}
          <span className="font-bold text-white">"{assessmentName}"</span>.
        </p>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-1">
          <p className="font-semibold text-red-400 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
            ⚠️ Se eliminará de forma permanente:
          </p>
          <ul className="space-y-2 text-red-300 text-sm">
            <li className="flex items-center gap-2"><span className="text-red-500 font-bold">✕</span> Todos los grupos del assessment</li>
            <li className="flex items-center gap-2"><span className="text-red-500 font-bold">✕</span> Todos los participantes</li>
            <li className="flex items-center gap-2"><span className="text-red-500 font-bold">✕</span> Todo el staff (admin/calificadores)</li>
            <li className="flex items-center gap-2"><span className="text-red-500 font-bold">✕</span> Todas las bases de calificación</li>
            <li className="flex items-center gap-2"><span className="text-red-500 font-bold">✕</span> <strong className="text-red-200">Todas las calificaciones registradas</strong></li>
          </ul>
        </div>
        <p className="text-[color:var(--color-muted)] text-sm mt-4">Por seguridad, ingresa la contraseña de borrado para confirmar.</p>
      </div>
    );

    const result = await confirm({
      title: 'Eliminar Assessment',
      message: deleteMessage,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      showInput: true,
      inputPlaceholder: 'Contraseña de seguridad',
      inputType: 'password'
    });

    if (result === false) return;

    setConfirmLoading(true);
    try {
      await onDelete(initialAssessment.id, typeof result === 'string' ? result : undefined);
      onClose();
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Assessment Fields */}
          <div className="space-y-4">
            <div>
              <InputBox 
                label="Nombre del Assessment"
                type="text" 
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Assessment 2024-1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción (Opcional)</label>
              <textarea 
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none min-h-[80px] text-gray-900"
                placeholder="Breve descripción..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="activoToggle" checked={activoStatus} onChange={e => {
                setActivoStatus(e.target.checked);
                if (e.target.checked && grupoId && activeAssessmentsByGroup[grupoId] && activeAssessmentsByGroup[grupoId] !== initialAssessment?.id) {
                  setWarning('ATENCIÓN: Ya existe un assessment activo para este grupo. Le recomendamos mantener solo uno.');
                } else {
                  setWarning(null);
                }
              }} className="w-4 h-4 text-[color:var(--color-accent)] rounded" />
              <label htmlFor="activoToggle" className="text-sm font-medium text-gray-700">Assessment Activo</label>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700">Grupo Estudiantil</label>
              <select 
                value={grupoId}
                onChange={handleGroupChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none bg-white text-gray-900 h-[50px]"
              >
                <option value="">Selecciona un grupo</option>
                {gruposEstudiantiles.map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Admin Logic */}
          {grupoId && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-[color:var(--color-accent)] rounded-full" />
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Administrador</h3>
              </div>
              
              {adminsForGroup.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase ml-1">Reasignar Administrador Existente</label>
                  <select 
                    value={reassignAdminId}
                    onChange={e => setReassignAdminId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-900 h-[50px]"
                  >
                    <option value="">-- Crear nuevo administrador --</option>
                    {adminsForGroup.map(a => (
                      <option key={a.id} value={a.id}>{a.correo}</option>
                    ))}
                  </select>
                </div>
              )}

              {!reassignAdminId && (
                <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <InputBox
                      label="Correo Electrónico"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                    />
                    {emailError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <InputBox
                      label="Contraseña"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                    />
                    {passwordError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {passwordError}
                      </p>
                    )}
                    <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                      <p className="text-[11px] leading-relaxed text-blue-700">
                        Asegúrese de guardar esta contraseña en un lugar seguro. No podrá ser visualizada nuevamente desde la interfaz.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning Block */}
          {warning && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">{warning}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          {isEdit ? (
            <div>
              <Button variant="error" onClick={handleDelete} disabled={isSubmitting}>
                Borrar Assessment
              </Button>
            </div>
          ) : <div />}

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSave} loading={isSubmitting} disabled={!nombre || !grupoId || (!reassignAdminId && (!adminEmail || !adminPassword))}>
              Confirmar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Nested Confirm Modal */}
      <ConfirmModalComponent />
    </div>
  );
};
