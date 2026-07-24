import { useState, useEffect, useRef } from 'react'
import { propertyApi, adminPropertyApi, PropertyPayload } from '@/api/propertyApi'

export type PropertyFormState = {
  title: string
  price: string
  currency: string
  location: string
  bedrooms: string
  bathrooms: string
  areaSqft: string
  landSizePerches: string
  type: string
  listingType: string
  verified: boolean
  furnishing: string
  parking: string
  listedBy: string
  description: string
  images: string[]
}

export const EMPTY_PROPERTY_FORM: PropertyFormState = {
  title: '', price: '', currency: 'AUD', location: '',
  bedrooms: '', bathrooms: '', areaSqft: '', landSizePerches: '',
  type: 'Apartment', listingType: 'Sale', verified: false,
  furnishing: '', parking: '', listedBy: '', description: '', images: [],
}

const MAX_FILE_MB = 5

type UsePropertyFormOptions = {
  editId?: string | null
  isAdminMode: boolean
  onSuccess?: (propertyId: string, isEdit: boolean) => void
}

export function usePropertyForm({ editId, isAdminMode, onSuccess }: UsePropertyFormOptions) {
  const [form, setForm] = useState<PropertyFormState>(EMPTY_PROPERTY_FORM)
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)

  const actualEditId = editId || createdPropertyId
  const isActuallyEditMode = Boolean(actualEditId)
  const isEditMode = Boolean(editId)

  const [imageInput, setImageInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing property in edit mode
  useEffect(() => {
    if (!editId) return
    async function load() {
      setLoadingProperty(true)
      try {
        const p = isAdminMode
          ? await adminPropertyApi.getOne(editId!)
          : await propertyApi.getProperty(editId!)
        setForm({
          title: p.title ?? '',
          price: p.price != null ? String(p.price) : '',
          currency: p.currency ?? 'AUD',
          location: p.location ?? '',
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
          areaSqft: p.areaSqft != null ? String(p.areaSqft) : '',
          landSizePerches: p.landSizePerches != null ? String(p.landSizePerches) : '',
          type: p.type ?? 'Apartment',
          listingType: p.listingType ?? 'Sale',
          verified: p.verified ?? false,
          furnishing: p.furnishing ?? '',
          parking: p.parking ?? '',
          listedBy: p.listedBy ?? '',
          description: p.description ?? '',
          images: Array.isArray(p.images) ? p.images : [],
        })
        setOriginalImageUrls(Array.isArray(p.images) ? p.images : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property.')
      } finally {
        setLoadingProperty(false)
      }
    }
    load()
  }, [editId])

  function set<K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm(EMPTY_PROPERTY_FORM)
    setCreatedPropertyId(null)
    setSubmitted(false)
    setOriginalImageUrls([])
    setError(null)
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    set('images', [...form.images, url])
    setImageInput('')
  }

  function removeImage(idx: number) {
    set('images', form.images.filter((_, i) => i !== idx))
  }

  function handleAddButtonClick() {
    const url = imageInput.trim()
    if (url) {
      addImage()
    } else {
      fileInputRef.current?.click()
    }
  }

  // Converts a File to a base64 data URL. Swap this for a real upload
  // call (POST multipart -> hosted URL) if the backend adds one later.
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsDataURL(file)
    })
  }

  async function handleFiles(fileList: FileList | File[]) {
    setUploadError(null)
    const files = Array.from(fileList)

    const validFiles = files.filter(f => {
      if (!f.type.startsWith('image/')) return false
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(`"${f.name}" is over ${MAX_FILE_MB}MB and was skipped.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      const dataUrls = await Promise.all(validFiles.map(fileToDataUrl))
      set('images', [...form.images, ...dataUrls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to read one or more files.')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  // handleSubmit — payload no longer carries images, and we attach them after
  async function handleSubmit() {
    // auto-include any URL still sitting in the input that wasn't explicitly "Added"
    const pendingUrl = imageInput.trim()
    const allImages = pendingUrl && !form.images.includes(pendingUrl)
      ? [...form.images, pendingUrl]
      : form.images

    if (!form.title.trim() || !form.price || !form.location.trim() || !form.listedBy.trim()) {
      setError('Title, price, location and listed-by are required.')
      return
    }
    setError(null)
    setSubmitting(true)

    const payload: PropertyPayload = {
      title: form.title.trim(),
      price: Number(form.price),
      currency: form.currency,
      location: form.location.trim(),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      landSizePerches: form.landSizePerches ? Number(form.landSizePerches) : null,
      type: form.type,
      listingType: form.listingType,
      verified: form.verified,
      furnishing: form.furnishing.trim() || null,
      parking: form.parking.trim() || null,
      listedBy: form.listedBy.trim(),
      description: form.description.trim(),
    }

    try {
      let propertyId: string
      if (isActuallyEditMode) {
        if (isAdminMode) {
          await adminPropertyApi.edit(actualEditId!, payload)
        } else {
          await propertyApi.editProperty(actualEditId!, payload)
        }
        propertyId = actualEditId!
      } else {
        if (isAdminMode) {
          const created = await adminPropertyApi.create(payload)
          propertyId = String(created.id)
        } else {
          const created = await propertyApi.addProperty(payload)
          propertyId = String(created.id)
        }
        setCreatedPropertyId(propertyId)
      }

      const newImageUrls = allImages.filter(url => !originalImageUrls.includes(url))
      const startIndex = originalImageUrls.length
      for (let i = 0; i < newImageUrls.length; i++) {
        if (isAdminMode) {
          await adminPropertyApi.addPropertyImage(propertyId, {
            url: newImageUrls[i],
            isPrimary: startIndex + i === 0,
            sortOrder: startIndex + i,
          })
        } else {
          await propertyApi.addPropertyImage(propertyId, {
            url: newImageUrls[i],
            isPrimary: startIndex + i === 0,
            sortOrder: startIndex + i,
          })
        }
      }

      setSubmitted(true)
      onSuccess?.(propertyId, isActuallyEditMode)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save property.')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form, set,
    isEditMode, isActuallyEditMode, actualEditId,
    imageInput, setImageInput,
    submitting, submitted, error,
    loadingProperty,
    isDragging, uploadError,
    fileInputRef,
    addImage, removeImage, handleAddButtonClick,
    handleDrop, handleDragOver, handleDragLeave, handleFileInputChange,
    handleSubmit, resetForm,
  }
}
