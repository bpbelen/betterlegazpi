document.addEventListener('DOMContentLoaded', () => {
  const officialsContainer = document.getElementById('officials-container');
  if (!officialsContainer) return;

  fetch('../data/officials.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      renderOfficials(data);
    })
    .catch((error) => {
      console.error('Error fetching officials data:', error);
      officialsContainer.innerHTML =
        '<p class="text-center text-danger">Failed to load officials data.</p>';
    });

  function renderOfficials(data) {
    let html = '';

    // Mayor & Vice Mayor
    html += '<div class="grid grid-2 mb-5">';

    // Mayor
    if (data.mayor) {
      html += `
        <div class="card text-center h-100" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div class="card-body" style="padding: 1.5rem;">
            <div class="avatar-placeholder" style="width: 80px; height: 80px; background: #e0f2fe; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-person-badge-fill" style="font-size: 2.5rem; color: var(--color-primary);"></i>
            </div>
            <h4 class="card-title mb-1" style="font-size: 1.25rem; font-weight: 700;">${data.mayor.name}</h4>
            <span class="badge" style="background: var(--color-primary); color: white; padding: 4px 14px; border-radius: 50px; font-size: 0.8rem;">${data.mayor.title || 'City Mayor'}</span>
            <div class="official-contacts mt-3" style="font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 10px;">
              <p class="mb-1"><i class="bi bi-envelope"></i> <a href="mailto:${data.mayor.email}" style="color: var(--color-text);">${data.mayor.email}</a></p>
              <p class="mb-1"><i class="bi bi-phone"></i> <a href="tel:09274143768" style="color: var(--color-text);">0927 414 3768 (GLOBE)</a></p>
              <p class="mb-0"><i class="bi bi-phone"></i> <a href="tel:09122983504" style="color: var(--color-text);">0912 298 3504 (TNT)</a></p>
            </div>
          </div>
        </div>
      `;
    }

    // Vice Mayor
    if (data.vice_mayor) {
      html += `
        <div class="card text-center h-100" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div class="card-body" style="padding: 1.5rem;">
            <div class="avatar-placeholder" style="width: 80px; height: 80px; background: #e0f2fe; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-person-badge-fill" style="font-size: 2.5rem; color: var(--color-primary);"></i>
            </div>
            <h4 class="card-title mb-1" style="font-size: 1.25rem; font-weight: 700;">${data.vice_mayor.name}</h4>
            <span class="badge" style="background: var(--color-primary); color: white; padding: 4px 14px; border-radius: 50px; font-size: 0.8rem;">${data.vice_mayor.title || 'City Vice Mayor'}</span>
            <div class="official-contacts mt-3" style="font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 10px;">
              <p class="mb-1" style="opacity: 0.6;"><i class="bi bi-envelope"></i> <span>Unlisted</span></p>
              <p class="mb-1"><i class="bi bi-telephone"></i> <a href="tel:0528205199" style="color: var(--color-text);">${data.vice_mayor.phone || '(052) 820-5199'}</a></p>
              <p class="mb-0" style="opacity: 0.6;"><i class="bi bi-phone"></i> <span>Unlisted</span></p>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';

    // City Councilors (12 members: 10 Regular + 2 Ex-Officio with icon bulleted committees)
    if (data.councilors && data.councilors.length > 0) {
      html += '<h3 class="text-center mt-5 mb-4" data-i18n="gov-sp-members">Sangguniang Panlungsod Members</h3>';
      html += '<div class="grid grid-3" style="gap: var(--spacing-md);">';
      
      data.councilors.forEach((councilor) => {
        const isLiga = councilor.badge_type === 'liga';
        const isSk = councilor.badge_type === 'sk';
        const isExOfficio = councilor.is_ex_officio || isLiga || isSk;

        const cardExtraClass = isLiga ? 'councilor-card--liga' : (isSk ? 'councilor-card--sk' : '');
        const badgeExtraClass = isLiga ? 'councilor-badge--liga' : (isSk ? 'councilor-badge--sk' : '');
        const exOfficioTag = isExOfficio ? '<span class="councilor-ex-officio-badge">EX-OFFICIO MEMBER</span>' : '';

        let commListHtml = '';
        if (councilor.committees && councilor.committees.length > 0) {
          commListHtml = '<ul class="councilor-committees-list">';
          councilor.committees.forEach((comm) => {
            commListHtml += `<li class="councilor-committee-item"><i class="bi ${comm.icon || 'bi-check-circle'}"></i> <span>${comm.name}</span></li>`;
          });
          commListHtml += '</ul>';
        } else {
          commListHtml = `<p class="councilor-committees">${councilor.designation || 'Sangguniang Panlungsod Member'}</p>`;
        }

        html += `
          <div class="councilor-card ${cardExtraClass}">
            <h4 class="councilor-name">${councilor.name}</h4>
            <span class="councilor-badge ${badgeExtraClass}">${councilor.title || 'SP Member'}</span>
            ${commListHtml}
            ${exOfficioTag}
          </div>
        `;
      });

      html += '</div>';
    }

    // Center-Aligned & Enlarged Simple Source Credit Line
    html += `
      <div class="source-credit-simple text-center" style="font-size: 0.98rem; color: #475569; margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 6px; text-align: center;">
        <i class="bi bi-info-circle"></i> Source: <a href="https://legazpi.gov.ph/executive/" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline;">City Government of Legazpi - Directory</a> &bull; <a href="https://legazpi.gov.ph/about-us/legislative/" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline;">City Government of Legazpi - Legislative</a>
      </div>
    `;

    officialsContainer.innerHTML = html;
  }
});
