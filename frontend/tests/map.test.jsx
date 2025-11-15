// tests/map.test.jsx
import { render, screen } from '@testing-library/react'
import MapView from '../src/components/MapView'

describe('MapView', () => {
  test('renders map container', () => {
    render(<MapView />)
    const mapElement = screen.getByTestId('map-container')
    expect(mapElement).toBeInTheDocument()
  })
})
