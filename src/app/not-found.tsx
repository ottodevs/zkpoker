import CardHand from '@/components/card-hand'
import ErrorContent from '@/components/error/error-content'
import ErrorLayout from '@/components/error/error-layout'

export default function NotFound() {
    return (
        <ErrorLayout>
            {/* Bad hand animation */}
            <CardHand card1='/images/cards/2c.svg' card2='/images/cards/7h.svg' className='mb-12' />

            <ErrorContent
                title='Bad Beat!'
                subtitle='Page Not Found'
                message="Looks like we've hit a snag at the table. Don't worry, even pros fold sometimes."
            />
        </ErrorLayout>
    )
}
