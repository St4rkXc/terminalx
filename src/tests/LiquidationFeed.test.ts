import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LiquidationFeed from '../components/highcharts/LiquidationFeed.vue';

describe('LiquidationFeed.vue', () => {
  it('renders liquidation header and controls', () => {
    const wrapper = mount(LiquidationFeed, {
      props: {
        symbol: 'BTCUSDT',
      },
    });

    expect(wrapper.text()).toContain('Live Liquidation Feed');
    expect(wrapper.text()).toContain('FUTURES');
    expect(wrapper.text()).toContain('LONG LIQ:');
    expect(wrapper.text()).toContain('SHORT LIQ:');
  });
});
