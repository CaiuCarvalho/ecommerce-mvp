import { useParams } from 'react-router-dom'
import ProductForm from '../../../components/admin/ProductForm'

export default function ProductEdit() {
  const { id } = useParams()
  return <ProductForm key={id} productId={id} />
}
