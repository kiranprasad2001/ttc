const gridItems = document.querySelectorAll('.grid-item');

gridItems.forEach(item => {
  item.addEventListener('click', () => {
    const recipient = item.dataset.recipient;
    const body = item.dataset.body;

    try {
      const smsUrl = `sms:${recipient}?body=${encodeURIComponent(body)}`;
      window.open(smsUrl, '_blank');
    } catch (error) {
      // Handle the error (e.g., display an error message)
      console.error("Error opening SMS app:", error);
      alert("Oops! There was an error opening the messaging app.");
    }
  });
});
