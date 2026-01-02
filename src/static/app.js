document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Générer la liste des participants
        let participantsHTML = "";
        if (details.participants.length > 0) {
            participantsHTML = `
              <div class="participants-section">
                <strong>Participants inscrits&nbsp;:</strong>
                <ul class="participants-list" style="list-style-type: none;"> // Masquer les puces
                  ${details.participants.map((email, index) => `
                    <li style="display: flex; align-items: center;">
                      <span>${email}</span>
                      <span style="cursor: pointer; margin-left: 8px;" title="Supprimer" onclick="unregisterParticipant(${index})">🗑️</span>
                    </li>
                  `).join("")}
                </ul>
              </div>
            `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants inscrits&nbsp;:</strong>
              <span class="no-participants">Aucun pour le moment</span>
            </div>
          `;
        }

// Rendre la fonction accessible globalement
window.unregisterParticipant = function(index) {
  // Cette fonction doit appeler l'API pour désinscrire le participant, puis rafraîchir la liste
  // On suppose que l'activité sélectionnée est celle affichée (à améliorer si plusieurs activités)
  const activity = document.getElementById("activity").value;
  // Récupérer l'email du participant à supprimer (on va chercher dans la liste affichée)
  const activityCards = document.querySelectorAll('.activity-card');
  let email = null;
  activityCards.forEach(card => {
    if (card.querySelector('h4').textContent === activity) {
      const emails = Array.from(card.querySelectorAll('.participants-list li span:first-child'));
      if (emails[index]) {
        email = emails[index].textContent;
      }
    }
  });
  if (!email) return;
  fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
    method: "POST"
  })
    .then(() => fetchActivities());
};

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Rafraîchir la liste des activités pour afficher le participant ajouté
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
