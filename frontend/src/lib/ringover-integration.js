// ============================================
// Intégration SDK RingOver
// Gestion des événements d'appel en temps réel
// ============================================

class RingoverIntegration {
  constructor(api) {
    this.api = api;
    this.sdk = null;
    this.currentCallId = null;
    this.callStartTime = null;
    this.initialized = false;
  }

  // Initialiser le SDK RingOver
  init() {
    if (this.initialized || !window.RingoverSDK) {
      return;
    }

    try {
      // Créer l'instance du SDK avec configuration
      this.sdk = new window.RingoverSDK({
        type: 'fixed',
        size: 'medium',
        animation: true,
        border: false,
        trayicon: true,
        backgroundColor: 'transparent'
      });

      // Écouter les événements d'appel
      this.setupEventListeners();

      this.initialized = true;
      console.log('RingOver SDK initialized');
    } catch (error) {
      console.error('Failed to initialize RingOver SDK:', error);
    }
  }

  // Configurer les écouteurs d'événements
  setupEventListeners() {
    if (!this.sdk) return;

    // Appel en cours de sonnerie / composition
    this.sdk.on('ringingCall', (event) => {
      console.log('Call ringing:', event.data);
      this.handleRingingCall(event.data);
    });

    // Appel décroché
    this.sdk.on('answeredCall', (event) => {
      console.log('Call answered:', event.data);
      this.handleAnsweredCall(event.data);
    });

    // Appel terminé
    this.sdk.on('hangupCall', (event) => {
      console.log('Call hangup:', event.data);
      this.handleHangupCall(event.data);
    });
  }

  // Gérer l'événement de sonnerie
  async handleRingingCall(data) {
    const { call_id, direction, from_number, to_number } = data;

    this.currentCallId = call_id;
    this.callStartTime = Date.now();

    // Pour les appels sortants, chercher le lead correspondant
    if (direction === 'out') {
      const leadId = this.findLeadIdFromNumber(to_number);

      if (leadId) {
        // Créer ou mettre à jour l'activité
        try {
          await this.api.request('/leads/' + leadId + '/activities', {
            method: 'POST',
            body: JSON.stringify({
              activity_type: 'call_made',
              title: 'Appel en cours',
              description: `Appel vers ${to_number}`,
              metadata: JSON.stringify({
                call_id,
                direction,
                from_number,
                to_number,
                status: 'ringing'
              })
            })
          });

          // Notifier l'utilisateur
          this.showNotification('📞 Appel en cours...', `Vers ${to_number}`);
        } catch (error) {
          console.error('Failed to create call activity:', error);
        }
      }
    }

    // Pour les appels entrants, afficher une notification
    if (direction === 'in') {
      this.showNotification('📞 Appel entrant', `De ${from_number}`);

      // Chercher si c'est un lead connu
      const lead = await this.findLeadByNumber(from_number);
      if (lead) {
        this.showNotification('💼 Lead identifié', `${lead.full_name || lead.company}`);
      }
    }
  }

  // Gérer l'événement de réponse
  async handleAnsweredCall(data) {
    const { call_id, direction, from_number, to_number, callDuration } = data;

    this.showNotification('✅ Appel en cours', 'Communication établie');

    // Mettre à jour l'activité existante
    if (direction === 'out') {
      const leadId = this.findLeadIdFromNumber(to_number);
      if (leadId) {
        await this.updateCallActivity(leadId, call_id, {
          status: 'answered',
          answered_at: Date.now()
        });
      }
    }
  }

  // Gérer l'événement de fin d'appel
  async handleHangupCall(data) {
    const { call_id, direction, from_number, to_number, callDuration } = data;

    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;

    this.showNotification(
      '📞 Appel terminé',
      `Durée: ${minutes}m ${seconds}s`
    );

    // Mettre à jour l'activité avec la durée finale
    const targetNumber = direction === 'out' ? to_number : from_number;
    const leadId = this.findLeadIdFromNumber(targetNumber);

    if (leadId) {
      try {
        await this.updateCallActivity(leadId, call_id, {
          status: 'ended',
          duration: callDuration,
          ended_at: Date.now()
        });

        // Déclencher un rafraîchissement de la page lead si on est dessus
        if (window.location.pathname.includes('lead.html')) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('id') === String(leadId)) {
            setTimeout(() => {
              if (typeof loadLead === 'function') {
                loadLead();
              }
            }, 2000);
          }
        }

        // Après 5 secondes, essayer de récupérer l'enregistrement
        setTimeout(() => {
          this.fetchCallRecording(leadId, call_id);
        }, 5000);

      } catch (error) {
        console.error('Failed to update call activity:', error);
      }
    }

    this.currentCallId = null;
    this.callStartTime = null;
  }

  // Mettre à jour une activité d'appel
  async updateCallActivity(leadId, callId, updateData) {
    try {
      // Récupérer les activités du lead
      const activities = await this.api.getLeadActivities(leadId);

      // Trouver l'activité correspondant au call_id
      const callActivity = activities.find(act => {
        if (act.metadata) {
          try {
            const metadata = JSON.parse(act.metadata);
            return metadata.call_id === callId;
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      if (callActivity) {
        // Préparer les mises à jour
        const updates = {};

        // Mettre à jour la description avec la durée
        if (updateData.duration !== undefined) {
          const minutes = Math.floor(updateData.duration / 60);
          const seconds = updateData.duration % 60;
          updates.description = `Appel terminé - Durée: ${minutes}m ${seconds}s`;
          updates.call_duration = updateData.duration;
        }

        if (updateData.status !== undefined) {
          updates.call_status = updateData.status;
        }

        // Mettre à jour via l'API
        if (Object.keys(updates).length > 0) {
          await this.api.updateActivity(leadId, callActivity.id, updates);
          console.log('Call activity updated:', { leadId, activityId: callActivity.id, updates });
        }
      }
    } catch (error) {
      console.error('Failed to update call activity:', error);
    }
  }

  // Récupérer l'enregistrement d'un appel
  async fetchCallRecording(leadId, callId) {
    try {
      // Utiliser l'API RingOver pour récupérer les détails de l'appel
      const calls = await this.api.getRingoverCalls();

      const call = calls.calls?.find(c => String(c.call_id) === String(callId));

      if (call && call.record) {
        console.log('Recording found for call:', callId, call.record);

        // Trouver l'activité et la mettre à jour avec l'URL
        const activities = await this.api.getLeadActivities(leadId);
        const callActivity = activities.find(act => {
          if (act.metadata) {
            try {
              const metadata = JSON.parse(act.metadata);
              return metadata.call_id === callId;
            } catch (e) {
              return false;
            }
          }
          return false;
        });

        if (callActivity) {
          // Mettre à jour avec l'URL d'enregistrement
          await this.api.updateActivity(leadId, callActivity.id, {
            recording_url: call.record,
            description: `${callActivity.description || 'Appel'} - Enregistrement disponible`
          });

          this.showNotification('🎙️ Enregistrement disponible', 'Consultez la timeline');

          // Rafraîchir la page si on est sur le lead
          if (window.location.pathname.includes('lead.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('id') === String(leadId)) {
              setTimeout(() => {
                if (typeof loadLead === 'function') {
                  loadLead();
                }
              }, 1000);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch call recording:', error);
    }
  }

  // Trouver un lead par numéro de téléphone
  async findLeadByNumber(phoneNumber) {
    try {
      // Nettoyer le numéro
      const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

      // Chercher dans les leads (vous pourriez ajouter un endpoint de recherche)
      // Pour l'instant, on retourne null
      return null;
    } catch (error) {
      console.error('Failed to find lead by number:', error);
      return null;
    }
  }

  // Trouver l'ID du lead depuis le numéro (depuis le contexte de la page)
  findLeadIdFromNumber(phoneNumber) {
    // Si on est sur la page d'un lead, retourner son ID
    if (window.location.pathname.includes('lead.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id');
    }
    return null;
  }

  // Afficher une notification
  showNotification(title, message) {
    // Utiliser le système de notifications du CRM si disponible
    if (window.utils && window.utils.showInfo) {
      window.utils.showInfo(`${title}: ${message}`);
    } else {
      console.log(`${title}: ${message}`);
    }
  }

  // Détruire le SDK
  destroy() {
    if (this.sdk) {
      // Le SDK RingOver n'a pas de méthode destroy explicite dans la doc
      this.sdk = null;
    }
    this.initialized = false;
  }
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
  window.RingoverIntegration = RingoverIntegration;
}
