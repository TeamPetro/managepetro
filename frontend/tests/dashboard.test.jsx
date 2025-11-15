// tests/dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import Dashboard from '../src/pages/Dashboard'

describe('Dashboard', () => {
  test('renders key metrics', () => {
    render(<Dashboard />)
    expect(screen.getByText(/total trucks/i)).toBeInTheDocument()
    expect(screen.getByText(/active deliveries/i)).toBeInTheDocument()
  })
})
