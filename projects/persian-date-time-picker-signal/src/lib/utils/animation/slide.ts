import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';

import { AnimationCurves, AnimationDuration } from './animation-consts';

const ANIMATION_TRANSITION_IN = `${AnimationDuration.BASE} ${AnimationCurves.EASE_OUT_QUINT}`;
const ANIMATION_TRANSITION_OUT = `${AnimationDuration.BASE} ${AnimationCurves.EASE_IN_QUINT}`;

export const slideMotion: AnimationTriggerMetadata = trigger('slideMotion', [
  state(
    'void',
    style({
      opacity: 0,
      transform: 'translateY(8px)',
      transformOrigin: 'top center'
    })
  ),
  state(
    'enter',
    style({
      opacity: 1,
      transform: 'translateY(0)',
      transformOrigin: 'top center'
    })
  ),
  transition('void => *', [animate(ANIMATION_TRANSITION_IN)]),
  transition('* => void', [animate(ANIMATION_TRANSITION_OUT)])
]);

export const slideUpMotion: AnimationTriggerMetadata = trigger('slideUpMotion', [
  state(
    'void',
    style({
      transform: 'translateY(8px)',
      opacity: 0,
      transformOrigin: 'top center'
    })
  ),
  state(
    'enter',
    style({
      transform: 'translateY(0)',
      opacity: 1,
      transformOrigin: 'top center'
    })
  ),
  transition('void => *', [animate(ANIMATION_TRANSITION_IN)]),
  transition('* => void', [animate(ANIMATION_TRANSITION_OUT)])
]);

export const slideAlertMotion: AnimationTriggerMetadata = trigger('slideAlertMotion', [
  transition(':leave', [
    style({
      opacity: 1,
      transform: 'scaleY(1)',
      transformOrigin: '0% 0%'
    }),
    animate(
      `${AnimationDuration.SLOW} ${AnimationCurves.EASE_IN_OUT_CIRC}`,
      style({
        opacity: 0,
        transform: 'scaleY(0)',
        transformOrigin: '0% 0%'
      })
    )
  ])
]);
