import { Alert } from 'react-native';
import type { Provider, Model } from '../../api/types.gen';

// Helper functions to show the dialogs
export function showProviderSelectionDialog(
  providers: Provider[],
  onProviderSelect: (id: string) => void
) {
  if (providers.length > 0) {
    Alert.alert(
      'Select Provider',
      'Choose a provider for this conversation',
      [
        ...providers.map(provider => ({
          text: provider.name,
          onPress: () => onProviderSelect(provider.id)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
}

export function showModelSelectionDialog(
  models: Model[],
  onModelSelect: (model: Model) => void
) {
  if (models.length > 0) {
    Alert.alert(
      'Select Model',
      'Choose a model for this conversation',
      [
        ...models.map(model => ({
          text: model.name,
          onPress: () => onModelSelect(model)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
}