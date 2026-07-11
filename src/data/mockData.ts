import { User, Event, Registration, Certificate, Notification, Institution } from '../types';

export const INITIAL_COLLEGES: Institution[] = [
  {
    id: 'col_anits',
    name: 'ANITS',
    domain: 'anits.edu',
    departments: [
      'Computer Science and Engineering (CSE)',
      'Electronics and Communication Engineering (ECE)',
      'Electrical and Electronics Engineering (EEE)',
      'Mechanical Engineering',
      'Computer Science and Design (CSD)',
      'Computer Science and Machine Learning (CSM)',
      'Information Technology (IT)',
      'Civil Engineering',
      'Cyber Security'
    ]
  },
  {
    id: 'col_gitam',
    name: 'GITAM',
    domain: 'gitam.edu',
    departments: [
      'GITAM Business School',
      'Management',
      'Computer Science and Engineering (CSE)',
      'Electronics and Communication Engineering (ECE)'
    ]
  }
];

export const COLLEGE_DEPARTMENT_PRESETS: { [key: string]: string[] } = {
  'ANITS': [
    'Computer Science and Engineering (CSE)',
    'Computer Science and Design (CSD)',
    'Computer Science and Machine Learning (CSM)',
    'Information Technology (IT)',
    'Cyber Security',
    'Electronics and Communication Engineering (ECE)',
    'Electrical and Electronics Engineering (EEE)',
    'Mechanical Engineering',
    'Civil Engineering'
  ],
  'GITAM': [
    'GITAM Business School',
    'Management',
    'Computer Science and Engineering (CSE)',
    'Electronics and Communication Engineering (ECE)'
  ]
};

export const MOCK_USERS: { [key: string]: User } = {};

export const INITIAL_EVENTS: Event[] = [];

export const INITIAL_REGISTRATIONS: Registration[] = [];

export const INITIAL_CERTIFICATES: Certificate[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];
