// varibale definitions
// let message_box_expanded = false
// const $message_box = document.getElementById('message-box')

// event listeners
window.addEventListener("load", () => {
    const $main = document.getElementById('main-content')
    $main.classList.replace('disabled', 'enabled')
})

// document.getElementById('email-message-expand-btn').onclick = (e) => {
//     console.log(window)
//     if (message_box_expanded) {
//         message_box_expanded = false
//         $message_box.classList.replace('h-150', 'h-30')
//         e.target.classList.replace('fa-down-left-and-up-right-to-center', 'fa-up-right-and-down-left-from-center')
//     }
//     else {
//         message_box_expanded = true
//         $message_box.classList.replace('h-30', 'h-150')
//         e.target.classList.replace('fa-up-right-and-down-left-from-center', 'fa-down-left-and-up-right-to-center')
//     }
// }

// document.getElementById('contact-form').onsubmit = async (e) => {
//     e.preventDefault()
//     console.log(e)
//     const $spinner = document.getElementById('email-send-spinner')

//     e.submitter.classList.add('opacity-0')
//     e.submitter.parentElement.classList.add('bg-teal-300')
//     $spinner.classList.replace('opacity-0', 'animate-spin')

//     const form_data = Object.fromEntries(new FormData(e.target).entries())

//     try {
//         const res = await fetch('/api/contact', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(form_data)
//         })

//         if(res.status === 200) {
//             e.target.reset()
//             e.submitter.classList.remove('opacity-0')
//             e.submitter.parentElement.classList.remove('bg-teal-300')
//             $spinner.classList.replace('animate-spin', 'opacity-0')
//             alert('Message sent successfully!')
//         }

//         const data = await res.json()
        
//     } catch (err) {
//         console.error(err)
//     }

// }

// function calls


// function definitions
function init() {

}

