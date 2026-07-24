import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { usePropertyForm } from '@/hooks/usePropertyForm'
import { PropertyFormFields } from '@/components/properties/PropertyFormFields'

type AddPropertyModalProps = {
  open: boolean
  onClose: () => void
  isAdminMode: boolean
  onCreated: (propertyId: string) => void
}

export function AddPropertyModal({ open, onClose, isAdminMode, onCreated }: AddPropertyModalProps) {
  const {
    form, set,
    imageInput, setImageInput,
    submitting, error,
    isDragging, uploadError,
    fileInputRef,
    handleAddButtonClick, removeImage,
    handleDrop, handleDragOver, handleDragLeave, handleFileInputChange,
    handleSubmit, resetForm,
  } = usePropertyForm({
    editId: null,
    isAdminMode,
    onSuccess: propertyId => {
      onCreated(propertyId)
      resetForm()
      onClose()
    },
  })

  function handleClose() {
    resetForm()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add new property" maxWidthClassName="max-w-2xl">
      <p className="-mt-2 mb-6 text-sm text-slate-500">Required fields are marked with *.</p>

      <PropertyFormFields
        form={form}
        set={set}
        imageInput={imageInput}
        setImageInput={setImageInput}
        fileInputRef={fileInputRef}
        isDragging={isDragging}
        uploadError={uploadError}
        handleAddButtonClick={handleAddButtonClick}
        removeImage={removeImage}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleFileInputChange={handleFileInputChange}
      />

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={handleClose} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Saving…' : 'Save property'}
        </button>
      </div>
    </Modal>
  )
}
