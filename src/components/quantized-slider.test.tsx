import { Slider } from '@base-ui/react/slider';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuantizedSlider } from './quantized-slider.js';

function Example({ onChange }: { onChange?: (value: number) => void }) {
  const [value, setValue] = useState(1);
  return (
    <>
      <button onClick={() => setValue(5)}>Reset</button>
      <output data-testid="value">{value}</output>
      <QuantizedSlider
        value={value}
        min={0.1}
        max={10}
        step={0.1}
        decimals={1}
        onValueChange={(next) => {
          onChange?.(next);
          setValue(next);
        }}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Thumb aria-label="Mass" />
          </Slider.Track>
        </Slider.Control>
      </QuantizedSlider>
    </>
  );
}

describe('QuantizedSlider', () => {
  it('retains fine positions across consumer echoes, emitting only quantized changes', () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: 'Mass' });
    fireEvent.change(slider, { target: { value: '1.034567' } });
    expect(slider).toHaveAttribute('aria-valuenow', '1.034567');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(slider, { target: { value: '1.067891' } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1.1);
    expect(slider).toHaveAttribute('aria-valuenow', '1.067891');
    fireEvent.change(slider, { target: { value: '1.08' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.change(slider, { target: { value: '1.045' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(slider).toHaveAttribute('aria-valuenow', '1.045');
    fireEvent.change(slider, { target: { value: '1.039' } });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  it('keeps keyboard increments independent and clamps at endpoints', () => {
    render(<Example />);
    const slider = screen.getByRole('slider', { name: 'Mass' });
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(screen.getByTestId('value')).toHaveTextContent('1.1');
    fireEvent.keyDown(slider, { key: 'ArrowUp', shiftKey: true });
    expect(screen.getByTestId('value')).toHaveTextContent('2.1');
    fireEvent.keyDown(slider, { key: 'PageDown' });
    expect(screen.getByTestId('value')).toHaveTextContent('1.1');
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'ArrowDown' });
    expect(slider).toHaveAttribute('aria-valuenow', '0.1');
    fireEvent.keyDown(slider, { key: 'End' });
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(slider).toHaveAttribute('aria-valuenow', '10');
  });
});
