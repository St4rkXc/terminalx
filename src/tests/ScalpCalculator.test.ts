import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ScalpCalculator from '../components/highcharts/ScalpCalculator.vue';

describe('ScalpCalculator.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(ScalpCalculator, {
      props: {
        symbol: 'BTCUSDT',
      },
    });

    expect(wrapper.text()).toContain('Scalp Risk & Size Calculator');
    expect(wrapper.text()).toContain('Long Scalp');
    expect(wrapper.text()).toContain('Short Scalp');
    expect(wrapper.text()).toContain('Recommended Position:');
  });

  it('updates dollar risk calculation when margin and risk percent change', async () => {
    const wrapper = mount(ScalpCalculator, {
      props: {
        symbol: 'BTCUSDT',
      },
    });

    // Default: $1000 margin with 1% risk => $10 risk
    expect(wrapper.text()).toContain('-$10.00');

    // Change margin to 2000
    const marginInput = wrapper.findAll('input[type="number"]')[0];
    await marginInput.setValue(2000);

    expect(wrapper.text()).toContain('-$20.00');
  });
});
