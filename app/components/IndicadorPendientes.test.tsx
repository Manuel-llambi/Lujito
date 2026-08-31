// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IndicadorPendientes } from '@/app/components/IndicadorPendientes'

describe('IndicadorPendientes — Req. 7.1', () => {
  it('con dos gastos pendientes, el indicador muestra 2', () => {
    render(<IndicadorPendientes cantidad={2} />)

    expect(screen.getByTestId('indicador-pendientes')).toHaveTextContent('2')
  })

  it('sin gastos pendientes, el indicador no se muestra', () => {
    render(<IndicadorPendientes cantidad={0} />)

    expect(screen.queryByTestId('indicador-pendientes')).not.toBeInTheDocument()
  })
})
