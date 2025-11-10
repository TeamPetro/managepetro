// tests/trucks.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import TrucksPage from '../src/pages/TrucksPage'
import axios from 'axios'
import { vi } from 'vitest'

vi.mock('axios')

describe('Trucks Page', () => {
  test('renders and loads trucks data', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, code: 'T001', plate: 'ABC123', status: 'active' },
        { id: 2, code: 'T002', plate: 'XYZ789', status: 'maintenance' },
      ],
    })

    render(<TrucksPage />)

    await waitFor(() => {
      expect(screen.getByText(/T001/i)).toBeInTheDocument()
      expect(screen.getByText(/XYZ789/i)).toBeInTheDocument()
    })
  })
})
