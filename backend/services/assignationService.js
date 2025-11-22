const db = require('../config/database');

/**
 * Service d'assignation automatique des bénévoles
 * Algorithme qui équilibre la charge, évite de solliciter toujours les mêmes personnes,
 * et remplit les créneaux les plus urgents en priorité
 */
class AssignationService {
  /**
   * Génère des assignations automatiques pour un événement
   * @param {number} evenementId - ID de l'événement
   * @returns {Promise<Array>} Liste des assignations proposées
   */
  async genererAssignationsAutomatiques(evenementId) {
    // Récupérer l'événement
    const [evenements] = await db.promise().execute(
      'SELECT * FROM evenements WHERE id = ?',
      [evenementId]
    );

    if (evenements.length === 0) {
      throw new Error('Événement non trouvé');
    }

    const evenement = evenements[0];
    const assignations = [];

    if (evenement.type_planification === 'creneaux') {
      assignations.push(...await this.assignerCreneaux(evenementId, evenement.association_id));
    } else {
      assignations.push(...await this.assignerTaches(evenementId, evenement.association_id));
    }

    return assignations;
  }

  /**
   * Assignation pour les créneaux horaires
   */
  async assignerCreneaux(evenementId, associationId) {
    // Récupérer tous les créneaux
    const [creneaux] = await db.promise().execute(
      'SELECT * FROM creneaux WHERE evenement_id = ? ORDER BY heure_debut',
      [evenementId]
    );

    // Récupérer les disponibilités
    const [disponibilites] = await db.promise().execute(
      `SELECT d.*, b.id as benevole_id
       FROM disponibilites d
       JOIN benevoles b ON d.benevole_id = b.id
       WHERE d.evenement_id = ? AND d.statut = 'disponible' AND d.creneau_id IS NOT NULL`,
      [evenementId]
    );

    // Récupérer les bénévoles acceptés
    const [benevoles] = await db.promise().execute(
      'SELECT b.id FROM benevoles b JOIN benevole_associations ba ON b.id = ba.benevole_id WHERE ba.association_id = ? AND ba.statut = ?',
      [associationId, 'accepte']
    );

    const benevolesIds = benevoles.map(b => b.id);

    // Récupérer l'historique des assignations pour équilibrer la charge
    const [historique] = await db.promise().execute(
      `SELECT benevole_id, COUNT(*) as nb_assignations
       FROM assignations
       WHERE benevole_id IN (?) AND statut = 'valide'
       GROUP BY benevole_id`,
      [benevolesIds]
    );

    const charges = {};
    benevolesIds.forEach(id => {
      charges[id] = 0;
    });
    historique.forEach(h => {
      charges[h.benevole_id] = h.nb_assignations;
    });

    // Organiser les disponibilités par créneau
    const dispoParCreneau = {};
    creneaux.forEach(c => {
      dispoParCreneau[c.id] = [];
    });

    disponibilites.forEach(d => {
      if (dispoParCreneau[d.creneau_id]) {
        dispoParCreneau[d.creneau_id].push({
          benevole_id: d.benevole_id,
          charge: charges[d.benevole_id] || 0
        });
      }
    });

    // Trier les créneaux par urgence (ordre chronologique)
    const creneauxTries = creneaux.sort((a, b) => {
      return a.heure_debut.localeCompare(b.heure_debut);
    });

    const assignations = [];
    const assignationsParBenevole = {}; // Pour éviter les doubles assignations dans le même événement

    for (const creneau of creneauxTries) {
      const personnesNecessaires = creneau.nombre_personnes_requises || 1;
      const disponibles = dispoParCreneau[creneau.id] || [];

      // Trier par charge croissante (privilégier ceux qui ont moins été sollicités)
      const disponiblesTries = disponibles.sort((a, b) => {
        // D'abord par charge
        if (a.charge !== b.charge) {
          return a.charge - b.charge;
        }
        // Puis aléatoirement pour varier
        return Math.random() - 0.5;
      });

      let assignees = 0;
      for (const dispo of disponiblesTries) {
        if (assignees >= personnesNecessaires) break;

        const benevoleId = dispo.benevole_id;

        // Éviter d'assigner le même bénévole à plusieurs créneaux du même événement
        // Sauf si nécessaire
        if (!assignationsParBenevole[benevoleId] || assignees === personnesNecessaires - 1) {
          assignations.push({
            benevole_id: benevoleId,
            creneau_id: creneau.id,
            tache_id: null
          });

          if (!assignationsParBenevole[benevoleId]) {
            assignationsParBenevole[benevoleId] = [];
          }
          assignationsParBenevole[benevoleId].push(creneau.id);
          assignees++;
          charges[benevoleId]++; // Mettre à jour la charge pour les créneaux suivants
        }
      }
    }

    return assignations;
  }

  /**
   * Assignation pour les tâches
   */
  async assignerTaches(evenementId, associationId) {
    // Récupérer toutes les tâches
    const [taches] = await db.promise().execute(
      'SELECT * FROM taches WHERE evenement_id = ? ORDER BY nom',
      [evenementId]
    );

    // Récupérer les disponibilités
    const [disponibilites] = await db.promise().execute(
      `SELECT d.*, b.id as benevole_id
       FROM disponibilites d
       JOIN benevoles b ON d.benevole_id = b.id
       WHERE d.evenement_id = ? AND d.statut = 'disponible' AND d.tache_id IS NOT NULL`,
      [evenementId]
    );

    // Récupérer les bénévoles acceptés
    const [benevoles] = await db.promise().execute(
      'SELECT b.id FROM benevoles b JOIN benevole_associations ba ON b.id = ba.benevole_id WHERE ba.association_id = ? AND ba.statut = ?',
      [associationId, 'accepte']
    );

    const benevolesIds = benevoles.map(b => b.id);

    // Récupérer l'historique des assignations pour équilibrer la charge
    const [historique] = await db.promise().execute(
      `SELECT benevole_id, COUNT(*) as nb_assignations
       FROM assignations
       WHERE benevole_id IN (?) AND statut = 'valide'
       GROUP BY benevole_id`,
      [benevolesIds]
    );

    const charges = {};
    benevolesIds.forEach(id => {
      charges[id] = 0;
    });
    historique.forEach(h => {
      charges[h.benevole_id] = h.nb_assignations;
    });

    // Organiser les disponibilités par tâche
    const dispoParTache = {};
    taches.forEach(t => {
      dispoParTache[t.id] = [];
    });

    disponibilites.forEach(d => {
      if (dispoParTache[d.tache_id]) {
        dispoParTache[d.tache_id].push({
          benevole_id: d.benevole_id,
          charge: charges[d.benevole_id] || 0
        });
      }
    });

    const assignations = [];
    const assignationsParBenevole = {}; // Pour équilibrer la charge

    for (const tache of taches) {
      const personnesNecessaires = tache.nombre_personnes_requises || 1;
      const disponibles = dispoParTache[tache.id] || [];

      // Trier par charge croissante
      const disponiblesTries = disponibles.sort((a, b) => {
        if (a.charge !== b.charge) {
          return a.charge - b.charge;
        }
        return Math.random() - 0.5;
      });

      let assignees = 0;
      for (const dispo of disponiblesTries) {
        if (assignees >= personnesNecessaires) break;

        const benevoleId = dispo.benevole_id;

        // Éviter d'assigner trop de tâches au même bénévole dans le même événement
        if (!assignationsParBenevole[benevoleId] || 
            assignationsParBenevole[benevoleId].length < Math.ceil(taches.length / benevolesIds.length) ||
            assignees === personnesNecessaires - 1) {
          assignations.push({
            benevole_id: benevoleId,
            creneau_id: null,
            tache_id: tache.id
          });

          if (!assignationsParBenevole[benevoleId]) {
            assignationsParBenevole[benevoleId] = [];
          }
          assignationsParBenevole[benevoleId].push(tache.id);
          assignees++;
          charges[benevoleId]++;
        }
      }
    }

    return assignations;
  }
}

module.exports = new AssignationService();

