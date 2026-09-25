import { UserRole } from './types.js';

/** Demo-only credentials used by the local seed and the one-click demo UI. */
export const DEMO_PASSWORD = 'Password123!';

export interface DemoAccountDefinition {
  email: string;
  password: string;
  role: UserRole;
  display_name: string;
  startup_name?: string;
  startup_description?: string;
  description: string;
  button_label: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccountDefinition[] = [
  {
    email: 'founder.a@droptest.local', password: DEMO_PASSWORD, role: 'startup',
    display_name: 'Kavita Rao', startup_name: 'EcoHemp Labs',
    startup_description: 'Sustainable organic apparel designed for urban eco-conscious professionals.',
    description: 'Founder (Clothing & Apparel)', button_label: 'Kavita (Apparel Startup)'
  },
  {
    email: 'founder.b@droptest.local', password: DEMO_PASSWORD, role: 'startup',
    display_name: 'Rohit Verma', startup_name: 'TerraBrew Innovations',
    startup_description: 'Cold-brew artisanal coffee systems and insulated ceramic drinkware.',
    description: 'Founder (Food & Beverage)', button_label: 'Rohit (Beverage Startup)'
  },
  {
    email: 'sponsor@droptest.local', password: DEMO_PASSWORD, role: 'sponsor',
    display_name: 'Vikram Malhotra', description: 'Sponsor / Ecosystem Supporter', button_label: 'Vikram (Sponsor)'
  },
  {
    email: 'shopper@droptest.local', password: DEMO_PASSWORD, role: 'user',
    display_name: 'Ananya Sharma', description: 'Shopper / Community Member', button_label: 'Ananya (Shopper)'
  }
] as const;
