// tests/auth.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../src/pages/Login'
import Register from '../src/pages/Register'
import { vi } from 'vitest'
import axios from 'axios'

vi.mock('axios')

describe('Auth Pages', () => {
  test('renders login form and submits successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { access_token: 'fake_token' } })

    render(<Login />)
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/token'), expect.anything())
    })
  })

  test('renders registration form and submits successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { id: 1, username: 'testuser' } })

    render(<Register />)
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), expect.anything())
    })
  })
})
