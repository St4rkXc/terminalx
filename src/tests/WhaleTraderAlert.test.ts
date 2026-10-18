import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WhaleTraderAlert from '../components/highcharts/WhaleTraderAlert.vue';

describe('WhaleTraderAlert.vue', () => {
  it('renders whale alerts header and threshold buttons', () => {
    const wrapper = mount(WhaleTraderAlert, {
      props: {
        symbol: 'BTCUSDT',
      },
    });

    expect(wrapper.text()).toContain('WHALE TRADER ALERTS');
    expect(wrapper.text()).toContain('WHALE BUY:');
    expect(wrapper.text()).toContain('WHALE SELL:');
    expect(wrapper.text()).toContain('10k');
    expect(wrapper.text()).toContain('25k');
    expect(wrapper.text()).toContain('50k');
  });

  it('updates threshold filter when filter button is clicked', async () => {
    const wrapper = mount(WhaleTraderAlert, {
      props: {
        symbol: 'BTCUSDT',
      },
    });

    const buttons = wrapper.findAll('button');
    const button50k = buttons.find((b) => b.text().includes('50k'));
    expect(button50k).toBeDefined();

    await button50k?.trigger('click');
    expect(wrapper.text()).toContain('>$50.0k');
  });
});
