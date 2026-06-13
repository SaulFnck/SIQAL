'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  AlertTriangle, 
  FileText, 
  Lock, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Plus, 
  Eye, 
  HelpCircle, 
  Check, 
  Loader2,
  Calendar,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { 
  getReports, 
  submitReport, 
  getDrafts, 
  saveDraft, 
  deleteDraft, 
  IReport, 
  IDraft, 
  IReportData 
} from '../utils/api';

const initialFormState: IReportData = {
  tipoReporte: 'anonimo',
  empresa: {
    razonSocial: '',
    giroComercial: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    codigoPostal: '',
    tieneSindicato: '',
  },
  vinculoLaboral: {
    puesto: '',
    tipoContrato: '',
    antiguedad: '',
    sigueLaborando: '',
  },
  detallesAbuso: {
    categoriasAbuso: [],
    fechaInicioHechos: '',
    descripcionDetallada: '',
    nombreAgresor: '',
    cargoAgresor: '',
  },
  testigosYAntecedentes: {
    existenTestigos: '',
    nombresTestigos: '',
    reportePrevio: '',
  },
  datosContacto: {
    nombre: '',
    email: '',
    telefono: '',
  }
};

export default function Home() {
  // Navigation / View states
  const [view, setView] = useState<'landing' | 'report-form' | 'success' | 'dashboard'>('landing');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data states
  const [formData, setFormData] = useState<IReportData>(initialFormState);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [draftId, setDraftId] = useState<string>('');
  
  // API states
  const [reports, setReports] = useState<IReport[]>([]);
  const [backendDrafts, setBackendDrafts] = useState<IDraft[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Validation / Warning states
  const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
  const [showTermsWarning, setShowTermsWarning] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  
  // Draft Save status indicator
  const [draftSaveStatus, setDraftSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a draft ID if not exists
  useEffect(() => {
    if (view === 'report-form' && !draftId) {
      const newId = 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      setDraftId(newId);
    }
  }, [view, draftId]);

  // Load backend history and drafts
  const loadDashboardData = async () => {
    setLoadingHistory(true);
    try {
      const [fetchedReports, fetchedDrafts] = await Promise.all([
        getReports(),
        getDrafts()
      ]);
      setReports(fetchedReports);
      setBackendDrafts(fetchedDrafts);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Trigger load when going to dashboard
  useEffect(() => {
    if (view === 'dashboard') {
      loadDashboardData();
    }
  }, [view]);

  // LocalStorage Autoload on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('ods8_report_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData && parsed.draftId) {
          // We don't restore it instantly, but keep it in case they want to continue
          console.log('Borrador local encontrado:', parsed.draftId);
        }
      } catch (e) {
        console.error('Error al analizar borrador de localStorage', e);
      }
    }
  }, []);

  // Autosave to localStorage and call backend
  const saveProgress = async (updatedData: IReportData, stepNum: number) => {
    if (!draftId) return;
    
    // Save to localStorage
    const draftPayload = {
      draftId,
      step: stepNum,
      formData: updatedData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('ods8_report_draft', JSON.stringify(draftPayload));
    setDraftSaveStatus('saving');

    // Save to backend
    try {
      let descStr = `Paso ${stepNum}: `;
      if (stepNum === 1) descStr += 'Datos de la empresa';
      else if (stepNum === 2) descStr += 'Vínculo laboral';
      else if (stepNum === 3) descStr += 'Detalles del abuso';
      else if (stepNum === 4) descStr += 'Evidencias y testigos';
      else if (stepNum === 5) descStr += 'Privacidad y envío';

      await saveDraft({
        idBorrador: draftId,
        pasoIncompleto: stepNum,
        descripcionPaso: descStr,
        formData: updatedData
      });
      setDraftSaveStatus('saved');
    } catch (err) {
      console.error('Error al guardar borrador en backend:', err);
      setDraftSaveStatus('error');
    }
  };

  // Helper to update nestable state & trigger autosave
  const updateNestedState = (section: keyof IReportData, field: string, value: any) => {
    setFormData((prev) => {
      const updatedSection = {
        ...(prev[section] as Record<string, any>),
        [field]: value
      };
      
      const newFormData = {
        ...prev,
        [section]: updatedSection
      };

      // Autosave
      saveProgress(newFormData, currentStep);
      return newFormData;
    });
  };

  // Direct state updates (e.g. tipoReporte)
  const updateDirectState = (field: keyof IReportData, value: any) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      saveProgress(newFormData, currentStep);
      return newFormData;
    });
  };

  // Category checkbox handler
  const handleCategoryChange = (category: string) => {
    setFormData((prev) => {
      const currentCats = prev.detallesAbuso.categoriasAbuso;
      const updatedCats = currentCats.includes(category)
        ? currentCats.filter((c) => c !== category)
        : [...currentCats, category];

      const newFormData = {
        ...prev,
        detallesAbuso: {
          ...prev.detallesAbuso,
          categoriasAbuso: updatedCats
        }
      };
      saveProgress(newFormData, currentStep);
      return newFormData;
    });
  };

  // Validation helper
  const validateStep = (stepNum: number): boolean => {
    const errors: { [key: string]: string } = {};

    if (stepNum === 1) {
      if (!formData.empresa.razonSocial.trim()) errors.razonSocial = 'La razón social o nombre comercial es requerida';
      if (!formData.empresa.giroComercial.trim()) errors.giroComercial = 'El sector comercial es requerido';
      if (!formData.empresa.calle.trim()) errors.calle = 'La calle es requerida';
      if (!formData.empresa.colonia.trim()) errors.colonia = 'La colonia es requerida';
      if (!formData.empresa.ciudad.trim()) errors.ciudad = 'La ciudad/estado es requerida';
      if (!formData.empresa.codigoPostal.trim()) errors.codigoPostal = 'El código postal es requerido';
      if (!formData.empresa.tieneSindicato) errors.tieneSindicato = 'Debe indicar si cuenta con sindicato';
    } 
    else if (stepNum === 2) {
      if (!formData.vinculoLaboral.puesto.trim()) errors.puesto = 'El puesto o cargo es requerido';
      if (!formData.vinculoLaboral.tipoContrato) errors.tipoContrato = 'El tipo de contrato es requerido';
      if (!formData.vinculoLaboral.antiguedad) errors.antiguedad = 'La antigüedad es requerida';
      if (!formData.vinculoLaboral.sigueLaborando) errors.sigueLaborando = 'Debe indicar si sigue laborando';
    }
    else if (stepNum === 3) {
      if (formData.detallesAbuso.categoriasAbuso.length === 0) {
        errors.categoriasAbuso = 'Debe seleccionar al menos una categoría de abuso';
      }
      if (!formData.detallesAbuso.fechaInicioHechos) errors.fechaInicioHechos = 'La fecha de inicio de los hechos es requerida';
      if (!formData.detallesAbuso.descripcionDetallada.trim()) errors.descripcionDetallada = 'La descripción detallada de los hechos es requerida';
    }
    else if (stepNum === 4) {
      if (!formData.testigosYAntecedentes.existenTestigos) errors.existenTestigos = 'Debe indicar si existen testigos';
      if (!formData.testigosYAntecedentes.reportePrevio) errors.reportePrevio = 'Debe seleccionar una opción de reporte previo';
    }
    else if (stepNum === 5) {
      if (formData.tipoReporte === 'confidencial') {
        if (!formData.datosContacto?.nombre?.trim()) errors.contactoNombre = 'El nombre completo es requerido para reportes confidenciales';
        if (!formData.datosContacto?.email?.trim()) errors.contactoEmail = 'El correo electrónico es requerido para reportes confidenciales';
        else if (!/\S+@\S+\.\S+/.test(formData.datosContacto.email)) errors.contactoEmail = 'El formato de correo electrónico no es válido';
        if (!formData.datosContacto?.telefono?.trim()) errors.contactoTelefono = 'El teléfono de contacto es requerido';
      }
      if (!acceptedTerms) {
        errors.terms = 'Debe aceptar los términos y condiciones';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        saveProgress(formData, nextStep);
        window.scrollTo(0, 0);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(formData, prevStep);
      window.scrollTo(0, 0);
    } else {
      setView('landing');
    }
  };

  // Submit Handler
  const [successInfo, setSuccessInfo] = useState<{ folio: string; fechaEnvio: string; fechaRespuesta: string } | null>(null);

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setShowTermsWarning(true);
      return;
    }

    setShowTermsWarning(false);
    setSubmitting(true);
    setSubmitError(null);
    setSubmissionProgress(10);

    // Simulate progress updates for visual feedback
    const timer = setInterval(() => {
      setSubmissionProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      // Clean contact info if anonymous
      const finalPayload = { ...formData };
      if (finalPayload.tipoReporte === 'anonimo') {
        delete finalPayload.datosContacto;
      }

      const submitted = await submitReport(finalPayload, attachedFiles);
      setSubmissionProgress(100);
      clearInterval(timer);

      // Save success info
      setSuccessInfo({
        folio: submitted.folio,
        fechaEnvio: new Date(submitted.fechaEnvio).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        fechaRespuesta: new Date(submitted.fechaRespuesta).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });

      // Clear local states & storage
      localStorage.removeItem('ods8_report_draft');
      if (draftId) {
        await deleteDraft(draftId).catch((err) => 
          console.error('Error al borrar borrador del backend tras envío:', err)
        );
      }
      setFormData(initialFormState);
      setAttachedFiles([]);
      setDraftId('');
      setAcceptedTerms(false);

      setView('success');
    } catch (err: any) {
      console.error(err);
      clearInterval(timer);
      setSubmitError(err.message || 'Error inesperado al enviar la denuncia. Reintente por favor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Continue Draft
  const handleContinueDraft = (draft: IDraft) => {
    setDraftId(draft.idBorrador);
    setCurrentStep(draft.pasoIncompleto);
    
    // Fill form state
    const restoredForm = {
      ...initialFormState,
      ...draft.formData,
      empresa: { ...initialFormState.empresa, ...draft.formData.empresa },
      vinculoLaboral: { ...initialFormState.vinculoLaboral, ...draft.formData.vinculoLaboral },
      detallesAbuso: { ...initialFormState.detallesAbuso, ...draft.formData.detallesAbuso },
      testigosYAntecedentes: { ...initialFormState.testigosYAntecedentes, ...draft.formData.testigosYAntecedentes },
      datosContacto: { ...initialFormState.datosContacto, ...draft.formData.datosContacto }
    };
    setFormData(restoredForm);
    setAttachedFiles([]);
    setView('report-form');
  };

  // Delete Draft Handler
  const handleDeleteDraft = async (idBorrador: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este borrador?')) {
      try {
        await deleteDraft(idBorrador);
        // Clear local storage if it's the active one
        if (idBorrador === draftId) {
          localStorage.removeItem('ods8_report_draft');
          setFormData(initialFormState);
          setDraftId('');
        }
        // Reload dashboard
        loadDashboardData();
      } catch (err) {
        alert('Error al borrar el borrador');
      }
    }
  };

  // Drag & drop file uploads
  const [dragActive, setDragActive] = useState<boolean>(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    // Validate sizes and types
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 10) {
        errors.push(`El archivo "${file.name}" supera el límite de 10MB.`);
        return;
      }
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'mp3', 'wav', 'm4a', 'ogg'];
      if (!extension || !validExtensions.includes(extension)) {
        errors.push(`El archivo "${file.name}" tiene un formato no válido. Use PDF, Imágenes o Audios.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HEADER GLOBAL */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setView('landing')} 
            className="w-10 h-10 bg-maroon rounded-lg flex items-center justify-center text-white font-bold cursor-pointer"
            aria-label="Ir a Inicio"
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Trabajo Decente</h1>
            <p className="text-xs text-gray-500">ODS 8 - Plataforma de Denuncia</p>
          </div>
        </div>
        
        <button 
          onClick={() => setView(view === 'dashboard' ? 'landing' : 'dashboard')}
          className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors ${
            view === 'dashboard' 
              ? 'bg-maroon text-white border-maroon' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
          }`}
          title="Panel de Usuario"
          aria-label="Panel de Usuario"
        >
          <User size={20} />
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-start">
        
        {/* VISTA 1: LANDING */}
        {view === 'landing' && (
          <div className="flex-1 flex flex-col justify-between py-4">
            
            {/* HERO */}
            <div className="text-center my-auto py-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-maroon-light text-maroon rounded-full text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 bg-maroon rounded-full"></span>
                ODS 8 - Trabajo Decente y Crecimiento Económico
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-none mb-6">
                Plataforma de Denuncia de Abusos Laborales
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10 leading-relaxed font-light">
                Un espacio seguro y confidencial para reportar violaciones a tus derechos laborales. Tu voz importa y mereces condiciones de trabajo dignas.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    setFormData(initialFormState);
                    setCurrentStep(1);
                    setView('report-form');
                  }}
                  className="bg-maroon hover:bg-maroon-hover text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-md transition-colors focus:ring-4 focus:ring-maroon-light cursor-pointer"
                >
                  Presentar un Reporte
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className="bg-white hover:bg-gray-50 text-gray-700 text-base font-semibold px-8 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-colors focus:ring-4 focus:ring-gray-100 cursor-pointer"
                >
                  Ver mis Reportes
                </button>
              </div>
            </div>

            {/* CARDS INFORMATIVAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 bg-red-50 text-maroon rounded-xl flex items-center justify-center mb-4">
                  <Lock size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">100% Confidencial</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Tu información está protegida. Puedes reportar de forma anónima o confidencial según tu preferencia.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 bg-blue-50 text-azul rounded-xl flex items-center justify-center mb-4">
                  <FileCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Proceso Guiado</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Formulario paso a paso que te guía en cada etapa. Tu progreso se guarda automáticamente.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Respuesta Rápida</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Recibirás un número de folio y actualizaciones sobre el estado de tu reporte en un plazo de 5 días.
                </p>
              </div>
            </div>
            
          </div>
        )}

        {/* VISTA 2: FORMULARIO WIZARD */}
        {view === 'report-form' && (
          <div className="flex-1 flex flex-col">
            
            {/* SUBHEADER FORMULARIO */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handlePrev}
                className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Regresar"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reporte de Abuso Laboral</h2>
                <p className="text-xs text-gray-500">Paso {currentStep} de 5</p>
              </div>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8 overflow-hidden">
              <div 
                className="bg-maroon h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>

            {/* CARD DEL FORMULARIO */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                
                {/* INDICADOR DE AUTOGUARDADO */}
                <div className="flex justify-end items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
                  <span className={`w-2 h-2 rounded-full ${
                    draftSaveStatus === 'saved' ? 'bg-emerald-500' :
                    draftSaveStatus === 'saving' ? 'bg-amber-500 animate-pulse' :
                    draftSaveStatus === 'error' ? 'bg-rose-500' : 'bg-gray-300'
                  }`}></span>
                  {draftSaveStatus === 'saved' && 'Progreso guardado automáticamente'}
                  {draftSaveStatus === 'saving' && 'Guardando progreso...'}
                  {draftSaveStatus === 'error' && 'Error al respaldar borrador'}
                  {!draftSaveStatus && 'Borrador activo'}
                </div>

                {/* PASO 1: DATOS DE LA EMPRESA */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Información de la Empresa</h3>
                      <p className="text-sm text-gray-500">Proporciona los datos de la empresa donde ocurrió el abuso laboral.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Razón Social */}
                      <div>
                        <label htmlFor="razonSocial" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Razón Social / Nombre Comercial <span className="text-rojo">*</span>
                        </label>
                        <input
                          id="razonSocial"
                          type="text"
                          placeholder="Nombre de la empresa"
                          value={formData.empresa.razonSocial}
                          onChange={(e) => updateNestedState('empresa', 'razonSocial', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon ${
                            stepErrors.razonSocial ? 'border-rojo focus:ring-rojo focus:border-rojo' : 'border-gray-200'
                          }`}
                        />
                        {stepErrors.razonSocial && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.razonSocial}</p>}
                      </div>

                      {/* Giro Comercial */}
                      <div>
                        <label htmlFor="giroComercial" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Giro o Sector Comercial <span className="text-rojo">*</span>
                        </label>
                        <select
                          id="giroComercial"
                          value={formData.empresa.giroComercial}
                          onChange={(e) => updateNestedState('empresa', 'giroComercial', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors focus:border-maroon focus:ring-1 focus:ring-maroon ${
                            stepErrors.giroComercial ? 'border-rojo focus:ring-rojo focus:border-rojo' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Selecciona el sector</option>
                          <option value="Comercio">Comercio / Tiendas</option>
                          <option value="Manufactura">Manufactura / Fábrica</option>
                          <option value="Servicios">Servicios / Oficinas</option>
                          <option value="Construcción">Construcción</option>
                          <option value="Agricultura">Agricultura / Campo</option>
                          <option value="Tecnología">Tecnología / TI</option>
                          <option value="Educación">Educación</option>
                          <option value="Salud">Salud / Hospitales</option>
                          <option value="Turismo">Turismo / Hotelería / Restaurante</option>
                          <option value="Otro">Otro sector</option>
                        </select>
                        {stepErrors.giroComercial && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.giroComercial}</p>}
                      </div>

                      {/* Calle y Número */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="calle" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Calle <span className="text-rojo">*</span>
                          </label>
                          <input
                            id="calle"
                            type="text"
                            placeholder="Nombre de la calle"
                            value={formData.empresa.calle}
                            onChange={(e) => updateNestedState('empresa', 'calle', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                              stepErrors.calle ? 'border-rojo' : 'border-gray-200'
                            }`}
                          />
                          {stepErrors.calle && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.calle}</p>}
                        </div>
                        <div>
                          <label htmlFor="numero" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Número <span className="text-rojo">*</span>
                          </label>
                          <input
                            id="numero"
                            type="text"
                            placeholder="Ext/Int"
                            value={formData.empresa.numero}
                            onChange={(e) => updateNestedState('empresa', 'numero', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                              stepErrors.numero ? 'border-rojo' : 'border-gray-200'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Colonia y Ciudad/Estado */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="colonia" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Colonia <span className="text-rojo">*</span>
                          </label>
                          <input
                            id="colonia"
                            type="text"
                            placeholder="Nombre de la colonia"
                            value={formData.empresa.colonia}
                            onChange={(e) => updateNestedState('empresa', 'colonia', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                              stepErrors.colonia ? 'border-rojo' : 'border-gray-200'
                            }`}
                          />
                          {stepErrors.colonia && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.colonia}</p>}
                        </div>
                        <div>
                          <label htmlFor="ciudad" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Ciudad/Estado <span className="text-rojo">*</span>
                          </label>
                          <input
                            id="ciudad"
                            type="text"
                            placeholder="Ciudad, Estado"
                            value={formData.empresa.ciudad}
                            onChange={(e) => updateNestedState('empresa', 'ciudad', e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                              stepErrors.ciudad ? 'border-rojo' : 'border-gray-200'
                            }`}
                          />
                          {stepErrors.ciudad && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.ciudad}</p>}
                        </div>
                      </div>

                      {/* CP */}
                      <div>
                        <label htmlFor="codigoPostal" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Código Postal <span className="text-rojo">*</span>
                        </label>
                        <input
                          id="codigoPostal"
                          type="text"
                          maxLength={5}
                          placeholder="00000"
                          value={formData.empresa.codigoPostal}
                          onChange={(e) => updateNestedState('empresa', 'codigoPostal', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.codigoPostal ? 'border-rojo' : 'border-gray-200'
                          }`}
                        />
                        {stepErrors.codigoPostal && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.codigoPostal}</p>}
                      </div>

                      {/* Sindicato */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-1.5">
                          ¿La empresa cuenta con sindicato? <span className="text-rojo">*</span>
                        </span>
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="tieneSindicato"
                              value="Si"
                              checked={formData.empresa.tieneSindicato === 'Si'}
                              onChange={() => updateNestedState('empresa', 'tieneSindicato', 'Si')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            Sí
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="tieneSindicato"
                              value="No"
                              checked={formData.empresa.tieneSindicato === 'No'}
                              onChange={() => updateNestedState('empresa', 'tieneSindicato', 'No')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            No
                          </label>
                        </div>
                        {stepErrors.tieneSindicato && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.tieneSindicato}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2: VÍNCULO LABORAL */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Vínculo Laboral</h3>
                      <p className="text-sm text-gray-500">Información sobre tu relación laboral con la empresa.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Puesto */}
                      <div>
                        <label htmlFor="puesto" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Puesto o Cargo <span className="text-rojo">*</span>
                        </label>
                        <input
                          id="puesto"
                          type="text"
                          placeholder="Tu puesto en la empresa"
                          value={formData.vinculoLaboral.puesto}
                          onChange={(e) => updateNestedState('vinculoLaboral', 'puesto', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.puesto ? 'border-rojo' : 'border-gray-200'
                          }`}
                        />
                        {stepErrors.puesto && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.puesto}</p>}
                      </div>

                      {/* Tipo de Contrato */}
                      <div>
                        <label htmlFor="tipoContrato" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Tipo de Contrato <span className="text-rojo">*</span>
                        </label>
                        <select
                          id="tipoContrato"
                          value={formData.vinculoLaboral.tipoContrato}
                          onChange={(e) => updateNestedState('vinculoLaboral', 'tipoContrato', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.tipoContrato ? 'border-rojo' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Selecciona el tipo</option>
                          <option value="Indeterminado">Indeterminado / Planta</option>
                          <option value="Determinado">Tiempo determinado / Proyecto</option>
                          <option value="Temporal">Temporal / Eventual</option>
                          <option value="Por Honorarios">Por Honorarios / Servicios Profesionales</option>
                          <option value="Sin Contrato">Sin contrato formal</option>
                          <option value="Otro">Otro</option>
                        </select>
                        {stepErrors.tipoContrato && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.tipoContrato}</p>}
                      </div>

                      {/* Antigüedad */}
                      <div>
                        <label htmlFor="antiguedad" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Antigüedad <span className="text-rojo">*</span>
                        </label>
                        <select
                          id="antiguedad"
                          value={formData.vinculoLaboral.antiguedad}
                          onChange={(e) => updateNestedState('vinculoLaboral', 'antiguedad', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.antiguedad ? 'border-rojo' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Tiempo laborando</option>
                          <option value="Menos de 6 meses">Menos de 6 meses</option>
                          <option value="6 meses a 1 año">De 6 meses a 1 año</option>
                          <option value="1 a 3 años">De 1 a 3 años</option>
                          <option value="3 a 5 años">De 3 a 5 años</option>
                          <option value="Más de 5 años">Más de 5 años</option>
                        </select>
                        {stepErrors.antiguedad && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.antiguedad}</p>}
                      </div>

                      {/* Sigue Laborando */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-1.5">
                          ¿Sigue laborando en la empresa? <span className="text-rojo">*</span>
                        </span>
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="sigueLaborando"
                              value="Si"
                              checked={formData.vinculoLaboral.sigueLaborando === 'Si'}
                              onChange={() => updateNestedState('vinculoLaboral', 'sigueLaborando', 'Si')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            Sí
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="sigueLaborando"
                              value="No"
                              checked={formData.vinculoLaboral.sigueLaborando === 'No'}
                              onChange={() => updateNestedState('vinculoLaboral', 'sigueLaborando', 'No')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            No
                          </label>
                        </div>
                        {stepErrors.sigueLaborando && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.sigueLaborando}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: DETALLES DEL ABUSO */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Detalles del Abuso Laboral</h3>
                      <p className="text-sm text-gray-500">Describe los hechos que motivaron este reporte.</p>
                    </div>

                    <div className="space-y-5">
                      {/* Categorías de Abuso */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-2">
                          Categoría del Abuso (puedes seleccionar varias) <span className="text-rojo">*</span>
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                          {[
                            'Acoso laboral o mobbing',
                            'Incumplimiento de pagos o salarios',
                            'Jornadas excesivas sin compensación',
                            'Discriminación (género, edad, etc.)',
                            'Despido injustificado',
                            'Condiciones de seguridad deficientes',
                            'Violación de derechos laborales',
                            'Otro'
                          ].map((cat) => (
                            <label 
                              key={cat} 
                              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm text-gray-700 font-medium cursor-pointer transition-colors ${
                                formData.detallesAbuso.categoriasAbuso.includes(cat)
                                  ? 'border-maroon bg-maroon-light/30 text-maroon'
                                  : 'border-gray-200 hover:bg-gray-50/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.detallesAbuso.categoriasAbuso.includes(cat)}
                                onChange={() => handleCategoryChange(cat)}
                                className="w-4.5 h-4.5 text-maroon rounded focus:ring-maroon accent-maroon cursor-pointer"
                              />
                              {cat}
                            </label>
                          ))}
                        </div>
                        {stepErrors.categoriasAbuso && <p className="text-xs text-rojo mt-2 font-medium">{stepErrors.categoriasAbuso}</p>}
                      </div>

                      {/* Fecha */}
                      <div>
                        <label htmlFor="fechaInicioHechos" className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                          <Calendar size={16} />
                          Fecha de inicio de los hechos <span className="text-rojo">*</span>
                        </label>
                        <input
                          id="fechaInicioHechos"
                          type="date"
                          value={formData.detallesAbuso.fechaInicioHechos}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateNestedState('detallesAbuso', 'fechaInicioHechos', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.fechaInicioHechos ? 'border-rojo' : 'border-gray-200'
                          }`}
                        />
                        {stepErrors.fechaInicioHechos && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.fechaInicioHechos}</p>}
                      </div>

                      {/* Descripción */}
                      <div>
                        <label htmlFor="descripcionDetallada" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          Descripción detallada de los hechos <span className="text-rojo">*</span>
                        </label>
                        <textarea
                          id="descripcionDetallada"
                          rows={4}
                          placeholder="Describe con el mayor detalle posible lo sucedido, incluyendo fechas, lugares y personas involucradas..."
                          value={formData.detallesAbuso.descripcionDetallada}
                          onChange={(e) => updateNestedState('detallesAbuso', 'descripcionDetallada', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors resize-none ${
                            stepErrors.descripcionDetallada ? 'border-rojo' : 'border-gray-200'
                          }`}
                        ></textarea>
                        {stepErrors.descripcionDetallada && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.descripcionDetallada}</p>}
                      </div>

                      {/* Agresor y Cargo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="nombreAgresor" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Nombre del agresor (opcional)
                          </label>
                          <input
                            id="nombreAgresor"
                            type="text"
                            placeholder="Nombre del superior / compañero"
                            value={formData.detallesAbuso.nombreAgresor}
                            onChange={(e) => updateNestedState('detallesAbuso', 'nombreAgresor', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="cargoAgresor" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Cargo del agresor (opcional)
                          </label>
                          <input
                            id="cargoAgresor"
                            type="text"
                            placeholder="Puesto del agresor"
                            value={formData.detallesAbuso.cargoAgresor}
                            onChange={(e) => updateNestedState('detallesAbuso', 'cargoAgresor', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 4: EVIDENCIAS Y TESTIGOS */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Evidencias y Testigos</h3>
                      <p className="text-sm text-gray-500">Cualquier prueba o testimonio que respalde tu reporte.</p>
                    </div>

                    <div className="space-y-5">
                      {/* Drag and Drop */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-2">
                          Carga de Archivos (Opcional)
                        </span>
                        
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                            dragActive 
                              ? 'border-maroon bg-maroon-light/20' 
                              : 'border-gray-200 hover:bg-gray-50/50'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,image/*,audio/*"
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="text-gray-400 mb-1" size={36} />
                            <p className="text-sm font-bold text-gray-800">
                              Arrastra archivos aquí o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF, imágenes o audios (máx. 10MB por archivo)
                            </p>
                          </div>
                        </div>

                        {/* List of attached files */}
                        {attachedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Archivos seleccionados:</h4>
                            {attachedFiles.map((file, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-sm">
                                <span className="text-gray-700 truncate max-w-md font-medium">{file.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-400 font-semibold">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="p-1 text-gray-400 hover:text-rojo transition-colors"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Testigos */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-1.5">
                          ¿Existen testigos de los hechos? <span className="text-rojo">*</span>
                        </span>
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="existenTestigos"
                              value="Si"
                              checked={formData.testigosYAntecedentes.existenTestigos === 'Si'}
                              onChange={() => updateNestedState('testigosYAntecedentes', 'existenTestigos', 'Si')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            Sí
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                            <input
                              type="radio"
                              name="existenTestigos"
                              value="No"
                              checked={formData.testigosYAntecedentes.existenTestigos === 'No'}
                              onChange={() => updateNestedState('testigosYAntecedentes', 'existenTestigos', 'No')}
                              className="w-4.5 h-4.5 text-maroon focus:ring-maroon accent-maroon"
                            />
                            No
                          </label>
                        </div>
                        {stepErrors.existenTestigos && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.existenTestigos}</p>}
                      </div>

                      {/* Nombres Testigos */}
                      {formData.testigosYAntecedentes.existenTestigos === 'Si' && (
                        <div>
                          <label htmlFor="nombresTestigos" className="block text-sm font-semibold text-gray-800 mb-1.5">
                            Nombres de los testigos (opcional)
                          </label>
                          <input
                            id="nombresTestigos"
                            type="text"
                            placeholder="Escribe los nombres separados por comas"
                            value={formData.testigosYAntecedentes.nombresTestigos || ''}
                            onChange={(e) => updateNestedState('testigosYAntecedentes', 'nombresTestigos', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white transition-colors"
                          />
                        </div>
                      )}

                      {/* Reporte Prev */}
                      <div>
                        <label htmlFor="reportePrevio" className="block text-sm font-semibold text-gray-800 mb-1.5">
                          ¿Se reportó previamente de forma interna? <span className="text-rojo">*</span>
                        </label>
                        <select
                          id="reportePrevio"
                          value={formData.testigosYAntecedentes.reportePrevio}
                          onChange={(e) => updateNestedState('testigosYAntecedentes', 'reportePrevio', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white transition-colors ${
                            stepErrors.reportePrevio ? 'border-rojo' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Selecciona una opción</option>
                          <option value="No">No se reportó previamente</option>
                          <option value="Si, y se resolvió">Sí, y se resolvió de forma interna</option>
                          <option value="Si, pero no hubo respuesta/acción">Sí, pero no hubo respuesta o acción por parte de la empresa</option>
                          <option value="Si, y hubo represalias">Sí, y se presentaron represalias / represalia laboral</option>
                        </select>
                        {stepErrors.reportePrevio && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.reportePrevio}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 5: PRIVACIDAD Y ENVÍO */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Privacidad y Envío</h3>
                      <p className="text-sm text-gray-500">Elige cómo deseas presentar tu reporte y acepta los términos.</p>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Cards Selección Privacidad */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-800 mb-3">
                          Tipo de Reporte <span className="text-rojo">*</span>
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Anónimo */}
                          <label 
                            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-colors ${
                              formData.tipoReporte === 'anonimo'
                                ? 'border-maroon bg-maroon-light/20 ring-1 ring-maroon'
                                : 'border-gray-200 hover:bg-gray-50/50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-bold text-gray-900">Reporte 100% Anónimo</span>
                              <input
                                type="radio"
                                name="tipoReporte"
                                value="anonimo"
                                checked={formData.tipoReporte === 'anonimo'}
                                onChange={() => updateDirectState('tipoReporte', 'anonimo')}
                                className="w-4.5 h-4.5 text-maroon accent-maroon"
                              />
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed font-light">
                              No se solicitarán datos personales. Tu identidad permanecerá completamente protegida.
                            </p>
                          </label>

                          {/* Confidencial */}
                          <label 
                            className={`p-5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-colors ${
                              formData.tipoReporte === 'confidencial'
                                ? 'border-maroon bg-maroon-light/20 ring-1 ring-maroon'
                                : 'border-gray-200 hover:bg-gray-50/50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-bold text-gray-900">Reporte Confidencial</span>
                              <input
                                type="radio"
                                name="tipoReporte"
                                value="confidencial"
                                checked={formData.tipoReporte === 'confidencial'}
                                onChange={() => updateDirectState('tipoReporte', 'confidencial')}
                                className="w-4.5 h-4.5 text-maroon accent-maroon"
                              />
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed font-light">
                              Proporciona tus datos para seguimiento. Solo personal autorizado tendrá acceso.
                            </p>
                          </label>
                        </div>
                      </div>

                      {/* Contact fields for confidential */}
                      {formData.tipoReporte === 'confidencial' && (
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-2">Datos de Contacto</h4>
                          
                          <div>
                            <label htmlFor="contactoNombre" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                              Nombre Completo <span className="text-rojo">*</span>
                            </label>
                            <input
                              id="contactoNombre"
                              type="text"
                              placeholder="Tu nombre completo"
                              value={formData.datosContacto?.nombre || ''}
                              onChange={(e) => updateNestedState('datosContacto', 'nombre', e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:border-maroon ${
                                stepErrors.contactoNombre ? 'border-rojo' : 'border-gray-200'
                              }`}
                            />
                            {stepErrors.contactoNombre && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.contactoNombre}</p>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="contactoEmail" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                                Correo Electrónico <span className="text-rojo">*</span>
                              </label>
                              <input
                                id="contactoEmail"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={formData.datosContacto?.email || ''}
                                onChange={(e) => updateNestedState('datosContacto', 'email', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:border-maroon ${
                                  stepErrors.contactoEmail ? 'border-rojo' : 'border-gray-200'
                                }`}
                              />
                              {stepErrors.contactoEmail && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.contactoEmail}</p>}
                            </div>
                            <div>
                              <label htmlFor="contactoTelefono" className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">
                                Teléfono <span className="text-rojo">*</span>
                              </label>
                              <input
                                id="contactoTelefono"
                                type="tel"
                                placeholder="10 dígitos"
                                value={formData.datosContacto?.telefono || ''}
                                onChange={(e) => updateNestedState('datosContacto', 'telefono', e.target.value.replace(/\D/g, ''))}
                                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:border-maroon ${
                                  stepErrors.contactoTelefono ? 'border-rojo' : 'border-gray-200'
                                }`}
                              />
                              {stepErrors.contactoTelefono && <p className="text-xs text-rojo mt-1 font-medium">{stepErrors.contactoTelefono}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Terms Acceptance */}
                      <div className={`p-4 rounded-xl border transition-colors ${
                        stepErrors.terms 
                          ? 'bg-red-50 border-rojo' 
                          : 'bg-blue-50/50 border-blue-100'
                      }`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => {
                              setAcceptedTerms(e.target.checked);
                              setStepErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.terms;
                                return copy;
                              });
                            }}
                            className="w-5 h-5 text-azul rounded border-gray-300 focus:ring-azul accent-azul cursor-pointer mt-0.5"
                          />
                          <span className="text-xs text-gray-700 leading-relaxed font-medium">
                            Acepto los <span className="text-azul underline font-semibold">Términos y Condiciones</span> y el <span className="text-azul underline font-semibold">Aviso de Privacidad</span> <span className="text-rojo">*</span>
                            <span className="block text-gray-400 mt-1 text-[10px] font-normal">
                              Al enviar este reporte, confirmo que la información proporcionada es verídica y autorizo su procesamiento conforme a la normativa vigente.
                            </span>
                          </span>
                        </label>
                      </div>

                      {/* Warning box if terms not checked */}
                      {showTermsWarning && !acceptedTerms && (
                        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm text-gray-600 font-medium">
                          <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                          <span>Debes aceptar los términos y condiciones para continuar</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* ACCIONES DEL FORMULARIO */}
              <div className="flex gap-4 mt-10 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-3 px-4 rounded-xl border border-gray-200 transition-colors shadow-xs"
                >
                  Anterior
                </button>
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-maroon hover:bg-maroon-hover text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors shadow-xs"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 bg-maroon hover:bg-maroon-hover disabled:bg-maroon/65 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Enviar Reporte
                  </button>
                )}
              </div>
            </div>

            {/* POPUP DE CARGA SIMULADA (SUBMITTING) */}
            {submitting && (
              <div className="fixed inset-0 bg-black/45 backdrop-filter backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                  <Loader2 size={42} className="animate-spin text-maroon mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Procesando Reporte</h3>
                  <p className="text-xs text-gray-400 mb-6 font-medium">Guardando evidencias y encriptando tu información...</p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                    <div 
                      className="bg-maroon h-2 rounded-full transition-all duration-300"
                      style={{ width: `${submissionProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-maroon font-bold">{submissionProgress}%</span>
                </div>
              </div>
            )}

            {/* MODAL ERROR AL ENVIAR */}
            {submitError && (
              <div className="fixed inset-0 bg-black/45 backdrop-filter backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center">
                  <AlertTriangle size={48} className="text-rojo mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Error de Conexión</h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {submitError}
                  </p>
                  <button
                    onClick={() => setSubmitError(null)}
                    className="w-full bg-maroon hover:bg-maroon-hover text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VISTA 3: PANTALLA DE ÉXITO */}
        {view === 'success' && successInfo && (
          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto py-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md text-center space-y-6">
              
              <div className="w-16 h-16 bg-blue-50 text-azul rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-950 mb-1">Denuncia Enviada Exitosamente</h2>
                <p className="text-sm text-gray-500">Tu reporte ha sido recibido y será revisado por nuestro equipo.</p>
              </div>

              {/* CAJA DE FOLIO */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3.5 text-left">
                <div className="text-center pb-2 border-b border-gray-200/60">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Número de Folio</span>
                  <span className="text-xl md:text-2xl font-extrabold text-gray-950 font-mono tracking-wider select-all">
                    {successInfo.folio}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Fecha de envío:</span>
                  <span className="text-gray-800 font-bold">{successInfo.fechaEnvio}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Respuesta estimada:</span>
                  <span className="text-azul font-bold">{successInfo.fechaRespuesta}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Guarda tu número de folio para dar seguimiento a tu reporte. Te notificaremos por correo electrónico cuando haya actualizaciones.
              </p>

              <button
                onClick={() => setView('dashboard')}
                className="w-full bg-maroon hover:bg-maroon-hover text-white text-base font-semibold py-3.5 rounded-xl shadow-md transition-colors"
              >
                Ver Panel de Usuario
              </button>

            </div>
          </div>
        )}

        {/* VISTA 4: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col">
            
            {/* SUBHEADER DASHBOARD */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('landing')}
                  className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Regresar"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-xl font-bold text-gray-955">Panel de Usuario</h2>
              </div>
              <button
                onClick={() => {
                  setFormData(initialFormState);
                  setAttachedFiles([]);
                  setDraftId('');
                  setCurrentStep(1);
                  setView('report-form');
                }}
                className="bg-maroon hover:bg-maroon-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Nueva Denuncia
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex-1 flex flex-col justify-center items-center py-16">
                <Loader2 size={36} className="animate-spin text-maroon mb-2" />
                <span className="text-sm text-gray-400 font-medium">Cargando reportes y borradores...</span>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* SECCIÓN DE BORRADORES */}
                {backendDrafts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Borradores Guardados</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {backendDrafts.map((draft) => {
                        const companyName = draft.formData?.empresa?.razonSocial || 'Empresa sin especificar';
                        const lastMod = draft.ultimaModificacion 
                          ? new Date(draft.ultimaModificacion).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : 'Reciente';

                        return (
                          <div 
                            key={draft.idBorrador} 
                            className="bg-amber-50/20 p-4 rounded-2xl border border-amber-200/50 flex justify-between items-center shadow-2xs gap-4"
                          >
                            <div className="min-w-0">
                              <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md mb-1.5 uppercase">
                                Borrador - Paso {draft.pasoIncompleto}
                              </span>
                              <h4 className="text-sm font-bold text-gray-900 truncate">{companyName}</h4>
                              <p className="text-xs text-gray-400 mt-0.5">Modificado: {lastMod}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleContinueDraft(draft)}
                                className="bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold px-3 py-2 rounded-xl border border-amber-200 transition-colors shadow-2xs"
                              >
                                Continuar
                              </button>
                              <button
                                onClick={() => handleDeleteDraft(draft.idBorrador)}
                                className="bg-white hover:bg-red-50 text-rojo p-2 rounded-xl border border-gray-200 transition-colors shadow-2xs"
                                title="Eliminar borrador"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECCIÓN DE REPORTES ENVIADOS */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Historial de Reportes</h3>
                  
                  {reports.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-xs">
                      <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-gray-700">No hay reportes enviados</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                        Aquí verás el historial de denuncias presentadas y su estado de revisión.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {reports.map((rep) => {
                        const dateSent = new Date(rep.fechaEnvio).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        });
                        const dateResp = new Date(rep.fechaRespuesta).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        });
                        
                        // Categories formatting
                        const categories = rep.detallesAbuso?.categoriasAbuso || [];
                        const categoriesText = categories.length > 0 ? categories.join(', ') : 'Sin categoría';

                        return (
                          <div 
                            key={rep._id}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-start gap-4"
                          >
                            <div className="w-10 h-10 bg-maroon-light text-maroon rounded-xl flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-extrabold text-gray-950 font-mono tracking-wide">
                                  {rep.folio}
                                </span>
                                
                                {/* Status badge */}
                                {rep.estado === 'pendiente' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-0.5 rounded-full uppercase">
                                    <Clock size={10} />
                                    Pendiente
                                  </span>
                                )}
                                {rep.estado === 'en-revision' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-50 text-azul border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase">
                                    <Eye size={10} />
                                    En Revisión
                                  </span>
                                )}
                                {rep.estado === 'resuelto' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 rounded-full uppercase">
                                    <Check size={10} />
                                    Resuelto
                                  </span>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Categoría del abuso</p>
                                <p className="text-sm text-gray-700 font-medium truncate mt-0.5">{categoriesText}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-2.5 text-xs text-gray-500 font-medium">
                                <div>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fecha de envío</span>
                                  <span className="block text-gray-700 mt-0.5 font-semibold">{dateSent}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Respuesta estimada</span>
                                  <span className="block text-azul mt-0.5 font-bold">{dateResp}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>
            )}
            
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-medium">
        <p>© {new Date().getFullYear()} ODS 8 - Trabajo Decente y Crecimiento Económico. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
