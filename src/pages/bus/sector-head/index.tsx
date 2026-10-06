/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react'
import { IAccountUser, getUser } from '@/frontend/store/auth'
import { useRouter } from 'next/router'
import GuardWrapper from '@/frontend/components/layouts/guardWrapper'
import AppWrapper from '@/frontend/components/layouts/appWrapper'
import { useBaseGetQuery } from '@/frontend/apis/base'
import { saveBusData } from '@/frontend/store/bus'
import dayjs from 'dayjs'

interface IEvent {
  id: string
  name: string
  start: string
  end: string
  timeSince: string
  live: boolean
  daysTo: number
}

export default function SectorHeadHome() {
  const [currentUser, setCurrentUser] = useState<IAccountUser>()
  const router = useRouter()

  const { isLoading: eventsLoading, data: eventsData } = useBaseGetQuery<IEvent[]>(
    'events/previous',
    {},
    {},
    !!currentUser
  )

  useEffect(() => {
    const user = getUser() as IAccountUser
    if (!user) router.push('/bus/login')
    setCurrentUser(user)
    saveBusData('selected-event', {})
  }, [])

  const gotoEventSummary = (event: IEvent) => {
    saveBusData('selected-event', event)
    router.push('/bus/sector-head/event')
  }

  return (
    <GuardWrapper allowed={['SECTOR_HEAD']} redirectTo='/bus/login' app='bus'>
      <AppWrapper>
        <Box mt={12}>
          <Text fontWeight={600} color={'gray.500'}>Events</Text>
          {eventsLoading ? <Skeleton h={16} rounded={'md'} w={'100%'} mb={4} /> : null}
          {eventsData?.data.map(item => (
            <Box
              key={item.id}
              borderColor={'gray.100'}
              borderWidth={1}
              rounded={'md'}
              p={4}
              mb={4}
              bg={'gray.100'}
              cursor={'pointer'}
              onClick={() => gotoEventSummary(item)}
            >
              <Flex justify={'space-between'} align={'center'} borderBottomWidth={1} borderColor={'gray.200'} pb={1}>
                <Flex align={'center'} gap={2}>
                  <Text color={'gray.500'} fontWeight={600}>{item.name}</Text>
                </Flex>
                {item.daysTo < 0 ? (
                  <Flex align={'center'} gap={2}>
                    <Box rounded={'full'} boxSize={3} bg="yellow.400"></Box>
                    <Text color={'gray.500'}>{item.timeSince}</Text>
                  </Flex>
                ) : item.daysTo > 0 ? (
                  <Flex align={'center'} gap={1}>
                    <Box rounded={'full'} boxSize={3} bg="red.400"></Box>
                    <Text color={'gray.500'}>{item.timeSince}</Text>
                  </Flex>
                ) : (
                  <Flex align={'center'} gap={1}>
                    <Text color={'gray.500'}>Active</Text>
                    <Box rounded={'full'} boxSize={3} bg="green.500"></Box>
                  </Flex>
                )}
              </Flex>
              <Flex color={'gray.500'} justify={'space-between'}>
                <Text fontSize={14}><Text as="span" fontWeight={600}>Start</Text> {dayjs(item.start).format('D MMM YYYY hh:mm a')}</Text>
                <Text fontSize={14}><Text as="span" fontWeight={600}>End</Text> {dayjs(item.end).format('D MMM YYYY hh:mm a')}</Text>
              </Flex>
            </Box>
          ))}
          {!eventsLoading && eventsData?.data.length === 0 && (
            <Text color={'gray.400'} textAlign={'center'} mt={8}>No events found</Text>
          )}
        </Box>
      </AppWrapper>
    </GuardWrapper>
  )
}
