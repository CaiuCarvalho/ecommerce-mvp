import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const signUp = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signUp }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m) => toastSuccess(m), error: (m) => toastError(m) },
}))

import Register from './Register'

beforeEach(() => {
  signUp.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/cadastro"]}>
      <Routes>
        <Route path="/cadastro" element={<Register />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Register page', () => {
  it('submits sign-up with form fields and navigates to home on success', async () => {
    signUp.mockResolvedValueOnce({})
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/Nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/Email/i), 'joao@test.com')
    await user.type(screen.getByLabelText(/Telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/Senha/i), 'secret123')

    await user.click(screen.getByRole('button', { name: /Criar Conta/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('joao@test.com', 'secret123', 'João Silva'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument())
  })

  it('shows error toast when sign-up fails', async () => {
    signUp.mockRejectedValueOnce(new Error('User already exists'))
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText(/Nome completo/i), 'Maria')
    await user.type(screen.getByLabelText(/Email/i), 'maria@test.com')
    await user.type(screen.getByLabelText(/Senha/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /Criar Conta/i }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('User already exists'))
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('links to /login', () => {
    renderApp()
    const link = screen.getByRole('link', { name: /Entrar/i })
    expect(link).toHaveAttribute('href', '/login')
  })
})
